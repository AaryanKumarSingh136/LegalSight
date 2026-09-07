from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin & System Settings"])

@router.get("/users")
def list_system_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all registered platform users (Analyst & Admin).
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {
        "users": [
            {
                "user_id": u.user_id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at.isoformat() if u.created_at else None
            } for u in users
        ]
    }

@router.get("/playbooks")
def get_playbook_settings():
    """
    Return active playbooks and custom risk threshold settings (Stubbed - Coming Soon).
    """
    return {
        "playbooks": [
            {
                "name": "Vendor Standard",
                "is_active": True,
                "editable": False,
                "description": "Standard balanced commercial protections favoring vendor baseline terms."
            },
            {
                "name": "M&A Aggressive",
                "is_active": True,
                "editable": False,
                "description": "Strict indemnity escrow thresholds, aggressive restrictive covenants."
            },
            {
                "name": "Strict Compliance",
                "is_active": True,
                "editable": False,
                "description": "Zero-tolerance GDPR/SOC2 security thresholds and mandatory audit rights."
            }
        ],
        "feature_status": "COMING_SOON",
        "message": "Custom playbook editor & automated risk threshold calibration are coming in v2.0."
    }

@router.get("/models/fine-tuning")
def get_model_tuning_status():
    """
    NLP Model fine-tuning console status (Stubbed - Coming Soon).
    """
    return {
        "active_ner_model": "LegalSight-EntityMatcher-v1 (Rule + Heuristic Zero-Shot)",
        "fine_tuning_pipeline": "DISABLED",
        "target_f1_score": 0.88,
        "current_precision": 0.93,
        "status": "COMING_SOON",
        "message": "Domain-specific LoRA fine-tuning for proprietary clause classification is scheduled for enterprise release."
    }
