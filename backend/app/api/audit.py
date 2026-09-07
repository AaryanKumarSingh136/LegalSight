from fastapi import APIRouter, Query, Body
from typing import List, Optional, Dict, Any
from app.models.schemas import AuditEvent
from app.services.audit_service import audit_service

router = APIRouter(prefix="/api/audit", tags=["Audit Trail & Admin Compliance"])

@router.get("/events", response_model=List[AuditEvent])
def get_audit_events(
    contract_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200)
):
    """Retrieve immutable audit events for compliance tracking."""
    return audit_service.get_events(contract_id=contract_id, limit=limit)

@router.get("/alerts", response_model=List[AuditEvent])
def get_compliance_alerts():
    """Retrieve active system warnings, critical risk triggers, and admin compliance alerts."""
    return audit_service.get_alerts()

@router.post("/log")
def log_custom_action(payload: Dict[str, Any] = Body(...)):
    """Log an analyst action into the audit trail."""
    event = audit_service.log_event(
        event_type=payload.get("event_type", "USER_ACTION"),
        action=payload.get("action", "User interaction recorded"),
        actor=payload.get("actor", "Legal Analyst"),
        contract_id=payload.get("contract_id"),
        details=payload.get("details", {}),
        severity=payload.get("severity", "INFO")
    )
    return event
