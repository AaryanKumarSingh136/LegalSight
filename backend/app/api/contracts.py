from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.schemas import ContractMetadata, RiskProfileType
from app.services.orchestrator import orchestrator
from app.sample_contracts.contracts import SAMPLE_CONTRACTS
from app.services.audit_service import audit_service
from app.api.auth import get_current_user
from app.db.database import get_db
from app.db.models import User, Contract, LegalClause

router = APIRouter(prefix="/api/contracts", tags=["Contracts Ingestion & Repository"])

@router.get("/samples")
def get_sample_contracts():
    """Return available preloaded contracts for instant testing."""
    samples = []
    for key, data in SAMPLE_CONTRACTS.items():
        samples.append({
            "key": key,
            "id": data["id"],
            "title": data["title"],
            "category": data["category"],
            "filename": data["filename"],
            "parties": data["parties"],
            "effective_date": data["effective_date"],
            "governing_law": data["governing_law"],
            "monetary_value": data["monetary_value"]
        })
    return {"samples": samples}

@router.get("")
def list_contracts(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all ingested contracts for the dashboard."""
    contracts = []
    try:
        db_contracts = db.query(Contract).order_by(Contract.created_at.desc()).all()
        for c in db_contracts:
            contracts.append({
                "contract_id": c.contract_id,
                "title": c.title,
                "filename": c.filename,
                "file_type": c.file_type,
                "file_size_bytes": c.file_size_bytes,
                "risk_level": c.risk_level,
                "risk_score": c.risk_score,
                "status": c.status,
                "risk_profile": c.risk_profile,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "owner_id": c.owner_id
            })
    except Exception:
        pass

    # If DB is empty, also include any in-memory contracts
    if not contracts:
        for cid, meta in orchestrator.contracts.items():
            job = next((j for j in orchestrator.jobs.values() if j.contract_id == cid), None)
            contracts.append({
                "contract_id": cid,
                "title": meta.filename.replace(".docx", "").replace(".pdf", "").replace("_", " "),
                "filename": meta.filename,
                "file_type": meta.file_type,
                "file_size_bytes": meta.file_size_bytes,
                "risk_level": job.risk_summary.overall_level.value if job and job.risk_summary else "LOW",
                "risk_score": job.risk_summary.overall_score if job and job.risk_summary else 0,
                "status": job.status if job else "PROCESSED",
                "risk_profile": meta.risk_profile.value if hasattr(meta.risk_profile, "value") else str(meta.risk_profile),
                "created_at": meta.uploaded_at.isoformat() if meta.uploaded_at else None,
                "owner_id": None
            })

    return {"contracts": contracts}

@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    risk_profile: RiskProfileType = Form(RiskProfileType.VENDOR_STANDARD),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Ingest a PDF or DOCX contract file, validate payload, and dispatch to orchestrator.
    """
    filename = file.filename or "uploaded_contract.docx"
    ext = filename.lower().split(".")[-1]
    if ext not in ["pdf", "docx", "doc", "txt", "md"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Please upload a PDF, DOCX, or TXT file."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum size limit of 25MB.")

    owner_id = current_user.user_id if current_user else None
    job_id = await orchestrator.initialize_from_bytes(file_bytes, filename, risk_profile, owner_id=owner_id)
    job = orchestrator.jobs[job_id]

    # Audit upload
    audit_service.log_event(
        contract_id=job.contract_id,
        user_id=owner_id,
        actor=current_user.username if current_user else "Analyst",
        event_type="CONTRACT_UPLOAD",
        action=f"Contract '{filename}' uploaded ({len(file_bytes)} bytes)",
        details={"filename": filename, "risk_profile": risk_profile.value},
        severity="INFO"
    )

    return {
        "job_id": job_id,
        "contract_id": job.contract_id,
        "filename": filename,
        "status": "PROCESSED",
        "message": "File successfully parsed and analyzed."
    }

@router.post("/load-sample/{sample_key}")
async def load_sample_contract(
    sample_key: str,
    risk_profile: RiskProfileType = RiskProfileType.VENDOR_STANDARD,
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Load a pre-configured realistic contract sample for immediate analysis.
    """
    # Resolve sample_key variants
    if sample_key not in SAMPLE_CONTRACTS:
        if f"sample_{sample_key}" in SAMPLE_CONTRACTS:
            sample_key = f"sample_{sample_key}"
        elif sample_key.replace("sample_", "") in SAMPLE_CONTRACTS:
            sample_key = sample_key.replace("sample_", "")
        else:
            raise HTTPException(status_code=404, detail=f"Sample contract '{sample_key}' not found.")

    owner_id = current_user.user_id if current_user else None
    job_id = await orchestrator.initialize_from_sample(sample_key, risk_profile, owner_id=owner_id)
    job = orchestrator.jobs[job_id]

    audit_service.log_event(
        contract_id=job.contract_id,
        user_id=owner_id,
        actor=current_user.username if current_user else "Analyst",
        event_type="SAMPLE_LOADED",
        action=f"Sample contract '{SAMPLE_CONTRACTS[sample_key]['title']}' loaded",
        details={"sample_key": sample_key, "risk_profile": risk_profile.value},
        severity="INFO"
    )

    return {
        "job_id": job_id,
        "contract_id": job.contract_id,
        "filename": SAMPLE_CONTRACTS[sample_key]["filename"],
        "status": "PROCESSED",
        "message": f"Sample '{SAMPLE_CONTRACTS[sample_key]['title']}' loaded and analyzed."
    }

@router.get("/{contract_id}")
async def get_contract_details(
    contract_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve metadata, raw text, and analysis state of an ingested contract."""
    # Find in memory first
    if contract_id in orchestrator.contracts:
        meta = orchestrator.contracts[contract_id]
        raw_text = orchestrator.raw_texts.get(contract_id, "")
        job = next((j for j in orchestrator.jobs.values() if j.contract_id == contract_id), None)
        
        # Log view
        audit_service.log_event(
            contract_id=contract_id,
            user_id=current_user.user_id if current_user else None,
            actor=current_user.username if current_user else "Analyst",
            event_type="CONTRACT_VIEWED",
            action=f"Contract '{meta.filename}' viewed in Reviewer UI",
            details={"contract_id": contract_id},
            severity="INFO"
        )
        
        return {
            "metadata": meta.model_dump(),
            "raw_text": raw_text,
            "job_id": job.job_id if job else None,
            "analysis": job.model_dump() if job else None
        }

    # Query DB
    db_contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
    if not db_contract:
        # Check if contract_id is a sample key or sample alias
        matched_sample = None
        for sk in SAMPLE_CONTRACTS.keys():
            if sk == contract_id or sk in contract_id or contract_id.replace("sample_", "").replace("cnt_", "") in sk:
                matched_sample = sk
                break
        
        if matched_sample:
            job_id = await orchestrator.initialize_from_sample(matched_sample, RiskProfileType.VENDOR_STANDARD)
            job = orchestrator.jobs[job_id]
            meta = orchestrator.contracts[job.contract_id]
            raw_text = orchestrator.raw_texts.get(job.contract_id, "")
            return {
                "metadata": meta.model_dump(),
                "raw_text": raw_text,
                "job_id": job_id,
                "analysis": job.model_dump()
            }

        raise HTTPException(status_code=404, detail=f"Contract '{contract_id}' not found.")

    return {
        "metadata": {
            "id": db_contract.contract_id,
            "filename": db_contract.filename,
            "file_size_bytes": db_contract.file_size_bytes,
            "file_type": db_contract.file_type,
            "uploaded_at": db_contract.created_at,
            "risk_profile": db_contract.risk_profile,
            "total_words": len(db_contract.raw_text.split()),
            "page_count": max(1, len(db_contract.raw_text.split()) // 350)
        },
        "raw_text": db_contract.raw_text,
        "job_id": None,
        "analysis": None
    }
