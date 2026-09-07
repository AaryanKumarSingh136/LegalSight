from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ClauseCategory(str, Enum):
    INDEMNITY = "Indemnity & Hold Harmless"
    LIMITATION_OF_LIABILITY = "Limitation of Liability"
    TERMINATION = "Termination & Default"
    CONFIDENTIALITY = "Confidentiality & Non-Disclosure"
    NON_COMPETE = "Non-Compete & Restrictive Covenants"
    GOVERNING_LAW = "Governing Law & Jurisdiction"
    INTELLECTUAL_PROPERTY = "Intellectual Property Rights"
    DATA_PRIVACY = "Data Privacy & GDPR/Security"
    PAYMENT_TERMS = "Payment & Commercial Terms"
    OTHER = "General / Miscellaneous"

class RiskProfileType(str, Enum):
    VENDOR_STANDARD = "Vendor Standard"
    MA_AGGRESSIVE = "M&A Aggressive"
    STRICT_COMPLIANCE = "Strict Compliance"
    BALANCED_COMMERCIAL = "Balanced Commercial"

class EntityExtraction(BaseModel):
    category: str
    text: str
    confidence: float = 0.95
    line_number: Optional[int] = None
    start_char: Optional[int] = None
    end_char: Optional[int] = None

class RedlineSuggestion(BaseModel):
    original_text: str
    suggested_replacement: str
    rationale: str
    action_type: str = "REPLACE"  # REPLACE, REMOVE, ADD

class ClauseBlock(BaseModel):
    id: str
    title: str
    category: ClauseCategory
    text: str
    start_idx: int
    end_idx: int
    risk_level: RiskLevel
    risk_score: int = Field(ge=0, le=100) # 0 (safe) to 100 (extreme risk)
    red_flag_phrases: List[str] = []
    mitigation_recommendation: Optional[str] = None
    redline: Optional[RedlineSuggestion] = None
    precedent_matches: List[Dict[str, Any]] = []
    user_approved: bool = False
    notes: Optional[str] = None

class RiskScoreSummary(BaseModel):
    overall_score: int  # 0 to 100
    overall_level: RiskLevel
    category_scores: Dict[str, int]
    flagged_clauses_count: Dict[str, int]  # e.g., {"CRITICAL": 2, "HIGH": 3, "MEDIUM": 1, "LOW": 4}
    executive_summary: str
    top_recommendations: List[str]

class ContractMetadata(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    file_type: str
    uploaded_at: datetime
    page_count: int = 1
    total_words: int = 0
    risk_profile: RiskProfileType = RiskProfileType.VENDOR_STANDARD

class AnalysisState(BaseModel):
    contract_id: str
    job_id: str
    current_step: int = 1  # 1 to 17
    step_description: str = "Ready for upload"
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    progress_percentage: int = 0
    entities: List[EntityExtraction] = []
    clauses: List[ClauseBlock] = []
    risk_summary: Optional[RiskScoreSummary] = None
    knowledge_graph_updated: bool = False
    audit_completed: bool = False
    finalized_at: Optional[datetime] = None

class PrecedentResult(BaseModel):
    id: str
    title: str
    jurisdiction: str
    standard_clause_text: str
    similarity_score: float
    relevance_rationale: str
    market_frequency_percent: int

class AuditEvent(BaseModel):
    id: str
    contract_id: Optional[str] = None
    event_type: str
    actor: str = "Legal Analyst"
    action: str
    details: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: str = "INFO" # INFO, WARNING, ALERT, CRITICAL

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # Contract, Entity, Clause, Risk, Precedent, Jurisdiction
    group: str
    properties: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    weight: float = 1.0

class KnowledgeGraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
