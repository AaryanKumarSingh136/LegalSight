import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from .database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(64), primary_key=True, default=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Analyst")  # Analyst or Admin
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    contracts = relationship("Contract", back_populates="owner", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class Contract(Base):
    __tablename__ = "contracts"

    contract_id = Column(String(64), primary_key=True, default=lambda: f"cnt_{uuid.uuid4().hex[:12]}")
    owner_id = Column(String(64), ForeignKey("users.user_id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), default="PDF")
    file_size_bytes = Column(Integer, default=0)
    raw_text = Column(Text, nullable=False)
    risk_level = Column(String(20), default="LOW")
    risk_score = Column(Integer, default=0)
    status = Column(String(50), default="PROCESSED")  # PROCESSING, PROCESSED, REVIEWED, COMPLETED
    risk_profile = Column(String(50), default="Vendor Standard")
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    owner = relationship("User", back_populates="contracts")
    clauses = relationship("LegalClause", back_populates="contract", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="contract")


class LegalClause(Base):
    __tablename__ = "legal_clauses"

    clause_id = Column(String(64), primary_key=True, default=lambda: f"cls_{uuid.uuid4().hex[:12]}")
    contract_id = Column(String(64), ForeignKey("contracts.contract_id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    text = Column(Text, nullable=False)
    start_idx = Column(Integer, default=0)
    end_idx = Column(Integer, default=0)
    risk_level = Column(String(20), default="LOW")
    risk_score = Column(Integer, default=0)
    red_flags = Column(Text, default="[]")  # JSON encoded list of strings
    redline_text = Column(Text, nullable=True)
    redline_rationale = Column(Text, nullable=True)
    user_approved = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    contract = relationship("Contract", back_populates="clauses")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(64), primary_key=True, default=lambda: f"log_{uuid.uuid4().hex[:12]}")
    user_id = Column(String(64), ForeignKey("users.user_id"), nullable=True, index=True)
    contract_id = Column(String(64), ForeignKey("contracts.contract_id"), nullable=True, index=True)
    actor = Column(String(100), default="System")
    action = Column(String(255), nullable=False)
    event_type = Column(String(100), nullable=False)
    details = Column(Text, default="{}")  # JSON encoded details
    severity = Column(String(20), default="INFO")  # INFO, WARNING, ALERT, CRITICAL
    timestamp = Column(DateTime, default=utc_now)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    contract = relationship("Contract", back_populates="audit_logs")
