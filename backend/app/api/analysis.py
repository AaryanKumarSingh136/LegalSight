import json
from fastapi import APIRouter, HTTPException, Body, Depends
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.schemas import RiskProfileType, AnalysisState
from app.services.orchestrator import orchestrator
from app.services.audit_service import audit_service
from app.api.auth import get_current_user
from app.db.database import get_db
from app.db.models import User, Contract, LegalClause

router = APIRouter(prefix="/api/analysis", tags=["Analysis & Risk Scoring"])

@router.get("/job/{job_id}", response_model=AnalysisState)
def get_job_state(
    job_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full analysis status, extracted entities, clauses, and risk scorecard."""
    if job_id in orchestrator.jobs:
        return orchestrator.jobs[job_id]

    # Attempt to restore from DB: derive contract_id from job_id or search DB
    candidate_contract_id = job_id.replace("job_", "cnt_")
    restored = orchestrator.restore_from_db(candidate_contract_id, db)
    if restored:
        return restored

    # Search contracts by prefix or match
    all_contracts = db.query(Contract).all()
    for c in all_contracts:
        if c.contract_id in job_id or job_id.replace("job_", "") in c.contract_id:
            restored = orchestrator.restore_from_db(c.contract_id, db)
            if restored:
                return restored

    raise HTTPException(status_code=404, detail="Job not found.")

@router.get("/contract/{contract_id}", response_model=AnalysisState)
def get_contract_analysis(
    contract_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve analysis state by contract ID."""
    job = next((j for j in orchestrator.jobs.values() if j.contract_id == contract_id), None)
    if job:
        return job

    restored = orchestrator.restore_from_db(contract_id, db)
    if restored:
        return restored

    raise HTTPException(status_code=404, detail="Analysis for contract not found.")


@router.post("/job/{job_id}/re-evaluate")
async def re_evaluate_profile(
    job_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Step 7 & 8: Switch Risk Profile and trigger real-time re-evaluation (Steps 9->11).
    """
    if job_id not in orchestrator.jobs:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    profile_str = payload.get("risk_profile", "Vendor Standard")
    try:
        profile = RiskProfileType(profile_str)
    except ValueError:
        profile = RiskProfileType.VENDOR_STANDARD

    await orchestrator.evaluate_risk_profile(job_id, profile)
    
    audit_service.log_event(
        contract_id=orchestrator.jobs[job_id].contract_id,
        user_id=current_user.user_id if current_user else None,
        actor=current_user.username if current_user else "Analyst",
        event_type="PROFILE_RE_EVALUATED",
        action=f"Risk profile changed to '{profile.value}' and re-evaluated",
        details={"profile": profile.value, "new_score": orchestrator.jobs[job_id].risk_summary.overall_score if orchestrator.jobs[job_id].risk_summary else 0},
        severity="INFO"
    )

    return {
        "job_id": job_id,
        "risk_profile": profile.value,
        "status": "RE_EVALUATED",
        "risk_summary": orchestrator.jobs[job_id].risk_summary
    }

@router.post("/job/{job_id}/clause/{clause_id}/approve")
def toggle_clause_approval(
    job_id: str,
    clause_id: str,
    payload: Optional[Dict[str, Any]] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a clause review step as approved/verified or toggle approval.
    """
    if job_id not in orchestrator.jobs:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    job = orchestrator.jobs[job_id]
    found = False
    approved_status = False
    clause_title = "Clause"
    
    for c in job.clauses:
        if c.id == clause_id:
            c.user_approved = not c.user_approved
            approved_status = c.user_approved
            clause_title = c.title
            if payload and "notes" in payload:
                c.notes = payload["notes"]
            found = True
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="Clause not found in job.")

    # Update DB if present
    try:
        db_clause = db.query(LegalClause).filter(LegalClause.clause_id == clause_id).first()
        if db_clause:
            db_clause.user_approved = approved_status
            if payload and "notes" in payload:
                db_clause.notes = payload["notes"]
            db.commit()
    except Exception:
        pass

    audit_service.log_event(
        contract_id=job.contract_id,
        user_id=current_user.user_id if current_user else None,
        actor=current_user.username if current_user else "Analyst",
        event_type="CLAUSE_REVIEW_TOGGLED",
        action=f"Clause '{clause_title}' marked as {'APPROVED' if approved_status else 'PENDING_REVIEW'}",
        details={"clause_id": clause_id, "approved": approved_status},
        severity="INFO"
    )
        
    return {"clause_id": clause_id, "user_approved": approved_status}

@router.post("/job/{job_id}/clause/{clause_id}/redline")
def update_clause_redline(
    job_id: str,
    clause_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update or accept a custom redline text for a clause.
    """
    if job_id not in orchestrator.jobs:
        raise HTTPException(status_code=404, detail="Job not found.")

    job = orchestrator.jobs[job_id]
    custom_text = payload.get("replacement_text", "")
    rationale = payload.get("rationale", "User customized redline")

    found = False
    for c in job.clauses:
        if c.id == clause_id:
            if c.redline:
                c.redline.suggested_replacement = custom_text
                c.redline.rationale = rationale
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Clause not found.")

    # Update in DB
    try:
        db_clause = db.query(LegalClause).filter(LegalClause.clause_id == clause_id).first()
        if db_clause:
            db_clause.redline_text = custom_text
            db_clause.redline_rationale = rationale
            db.commit()
    except Exception:
        pass

    audit_service.log_event(
        contract_id=job.contract_id,
        user_id=current_user.user_id if current_user else None,
        actor=current_user.username if current_user else "Analyst",
        event_type="REDLINE_UPDATED",
        action=f"Custom redline applied to clause '{clause_id}'",
        details={"clause_id": clause_id, "replacement_preview": custom_text[:80]},
        severity="INFO"
    )

    return {"clause_id": clause_id, "replacement_text": custom_text, "rationale": rationale}

@router.post("/job/{job_id}/finalize")
async def finalize_contract_review(
    job_id: str,
    payload: Dict[str, Any] = Body(default={"actor": "Lead Legal Counsel"}),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Trigger final sign-off, commit to DB, index vectors, and log audit.
    """
    if job_id not in orchestrator.jobs:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    actor = payload.get("actor", current_user.username if current_user else "Lead Legal Counsel")
    await orchestrator.finalize_review(job_id, actor_name=actor)
    
    job = orchestrator.jobs[job_id]
    return {
        "job_id": job_id,
        "status": job.status,
        "finalized_at": job.finalized_at,
        "message": "Contract analysis successfully committed, indexed, and audited."
    }
