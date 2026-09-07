from fastapi import APIRouter, HTTPException, Response, Depends
from typing import Optional
from app.services.orchestrator import orchestrator
from app.services.export_service import ExportService
from app.services.audit_service import audit_service
from app.api.auth import get_current_user
from app.db.models import User

router = APIRouter(prefix="/api/export", tags=["Export Engine"])

@router.get("/pdf/{job_or_contract_id}")
def export_pdf_report(
    job_or_contract_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Generate and download an Executive Summary PDF report."""
    job = orchestrator.jobs.get(job_or_contract_id)
    if not job:
        job = next((j for j in orchestrator.jobs.values() if j.contract_id == job_or_contract_id), None)
    
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job or contract not found.")
    
    contract = orchestrator.contracts.get(job.contract_id)
    if not contract or not job.risk_summary:
        raise HTTPException(status_code=400, detail="Analysis incomplete. Run risk evaluation first.")

    pdf_bytes = ExportService.generate_pdf_report(
        contract=contract,
        risk_summary=job.risk_summary,
        clauses=job.clauses,
        entities=job.entities
    )

    clean_filename = contract.filename.replace(" ", "_").replace(".docx", "").replace(".pdf", "")
    
    audit_service.log_event(
        contract_id=contract.id,
        user_id=current_user.user_id if current_user else None,
        actor=current_user.username if current_user else "Analyst",
        event_type="REPORT_EXPORTED_PDF",
        action=f"Executive PDF report generated for '{contract.filename}'",
        details={"format": "PDF", "file_size": len(pdf_bytes)},
        severity="INFO"
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=LegalSight_Audit_{clean_filename}.pdf"
        }
    )

@router.get("/summary/{job_or_contract_id}")
def export_summary_json(
    job_or_contract_id: str,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Download analysis payload in structured JSON format."""
    job = orchestrator.jobs.get(job_or_contract_id)
    if not job:
        job = next((j for j in orchestrator.jobs.values() if j.contract_id == job_or_contract_id), None)
    
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job or contract not found.")
    
    contract = orchestrator.contracts.get(job.contract_id)
    
    audit_service.log_event(
        contract_id=contract.id if contract else None,
        user_id=current_user.user_id if current_user else None,
        actor=current_user.username if current_user else "Analyst",
        event_type="REPORT_EXPORTED_JSON",
        action=f"JSON analysis exported for '{contract.filename if contract else 'contract'}'",
        details={"format": "JSON"},
        severity="INFO"
    )

    return {
        "metadata": contract.model_dump() if contract else {},
        "analysis_state": job.model_dump()
    }
