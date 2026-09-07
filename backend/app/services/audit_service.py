import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.schemas import AuditEvent
from app.db.database import SessionLocal
from app.db.models import AuditLog

def utc_now():
    return datetime.now(timezone.utc)

class AuditService:
    """
    Audit & Compliance Event Logger.
    Maintains immutable event trails in database and memory.
    """

    def __init__(self):
        self.events: List[AuditEvent] = []
        self._seed_initial_events()

    def _seed_initial_events(self):
        self.log_event(
            event_type="SYSTEM_BOOT",
            actor="System",
            action="LegalSight NLP Engine & Database initialized",
            details={"version": "1.0.0", "status": "ONLINE"},
            severity="INFO"
        )

    def log_event(
        self,
        event_type: str,
        action: str,
        actor: str = "Legal Analyst",
        user_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        severity: str = "INFO"
    ) -> AuditEvent:
        event = AuditEvent(
            id=f"log_{uuid.uuid4().hex[:8]}",
            contract_id=contract_id,
            event_type=event_type,
            actor=actor,
            action=action,
            details=details or {},
            timestamp=utc_now(),
            severity=severity
        )
        self.events.insert(0, event)

        # Persist to database
        try:
            db = SessionLocal()
            log_entry = AuditLog(
                log_id=event.id,
                user_id=user_id,
                contract_id=contract_id,
                actor=actor,
                action=action,
                event_type=event_type,
                details=json.dumps(details or {}),
                severity=severity,
                timestamp=event.timestamp
            )
            db.add(log_entry)
            db.commit()
            db.close()
        except Exception as e:
            # Fallback to memory
            pass

        return event

    def get_events(self, contract_id: Optional[str] = None, limit: int = 50) -> List[AuditEvent]:
        try:
            db = SessionLocal()
            query = db.query(AuditLog)
            if contract_id:
                query = query.filter((AuditLog.contract_id == contract_id) | (AuditLog.contract_id.is_(None)))
            logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
            db.close()
            if logs:
                return [
                    AuditEvent(
                        id=l.log_id,
                        contract_id=l.contract_id,
                        event_type=l.event_type,
                        actor=l.actor,
                        action=l.action,
                        details=json.loads(l.details) if l.details else {},
                        timestamp=l.timestamp,
                        severity=l.severity
                    ) for l in logs
                ]
        except Exception:
            pass

        if contract_id:
            filtered = [e for e in self.events if e.contract_id == contract_id or e.contract_id is None]
            return filtered[:limit]
        return self.events[:limit]

    def get_alerts(self) -> List[AuditEvent]:
        events = self.get_events(limit=100)
        return [e for e in events if e.severity in ["WARNING", "ALERT", "CRITICAL"]]

audit_service = AuditService()
