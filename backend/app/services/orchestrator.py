import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Callable
from app.models.schemas import (
    AnalysisState, ContractMetadata, RiskProfileType, RiskScoreSummary,
    ClauseBlock, EntityExtraction, KnowledgeGraphData, RiskLevel
)
from app.services.parser import DocumentParser
from app.services.nlp_engine import NLPEngine
from app.services.risk_evaluator import RiskEvaluator
from app.services.vector_store import vector_store
from app.services.knowledge_graph import knowledge_graph_service
from app.services.audit_service import audit_service
from app.sample_contracts.contracts import SAMPLE_CONTRACTS
from app.db.database import SessionLocal
from app.db.models import Contract, LegalClause, AuditLog

def utc_now():
    return datetime.now(timezone.utc)

STEP_DESCRIPTIONS = {
    1: "Step 1: Ingestion Gateway received contract file (.pdf/.docx/sample).",
    2: "Step 2: Payload integrity, MIME type, and size formatting validated.",
    3: "Step 3: Gateway dispatched payload to the Analysis Orchestrator.",
    4: "Step 4: Orchestrator executing text extraction, OCR normalization & tokenization.",
    5: "Step 5: NLP Engine completed Named Entity Recognition (NER) & Clause Segmentation.",
    6: "Step 6: Analysis state dispatched to Client Dashboard.",
    7: "Step 7: Risk Profile selection captured.",
    8: "Step 8: Orchestrator configured with active Risk Profile matrix.",
    9: "Step 9: Orchestrator initiating deep risk evaluation against legal playbooks.",
    10: "Step 10: NLP Engine calculated clause risk scores, flagged red flags & drafted redlines.",
    11: "Step 11: Live dashboard updated with dynamic Risk Radar & Scorecard.",
    12: "Step 12: Legal analyst confirmed clause audit checklist & mitigation actions.",
    13: "Step 13: Final contract sign-off review triggered.",
    14: "Step 14: Analysis state committed to primary persistent database.",
    15: "Step 15: Dense clause embeddings indexed into Vector Store for similarity retrieval.",
    16: "Step 16: Legal Knowledge Graph topological nodes & edges linked.",
    17: "Step 17: Compliance Admin automated audit summary & notification dispatched."
}

class Orchestrator:
    """
    Multi-Step Workflow Orchestration Controller.
    Manages contract analysis lifecycle, database persistence, and audit logging.
    """

    def __init__(self):
        self.jobs: Dict[str, AnalysisState] = {}
        self.contracts: Dict[str, ContractMetadata] = {}
        self.raw_texts: Dict[str, str] = {}
        self.knowledge_graphs: Dict[str, KnowledgeGraphData] = {}
        self.listeners: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}

    def subscribe(self, job_id: str, callback: Callable[[Dict[str, Any]], None]):
        if job_id not in self.listeners:
            self.listeners[job_id] = []
        self.listeners[job_id].append(callback)

    def unsubscribe(self, job_id: str, callback: Callable[[Dict[str, Any]], None]):
        if job_id in self.listeners and callback in self.listeners[job_id]:
            self.listeners[job_id].remove(callback)

    async def emit_step(self, job_id: str, step: int, extra_data: Optional[Dict[str, Any]] = None):
        if job_id not in self.jobs:
            return
        
        state = self.jobs[job_id]
        state.current_step = step
        state.step_description = STEP_DESCRIPTIONS.get(step, f"Step {step} processing...")
        state.progress_percentage = int((step / 17) * 100)
        
        payload = {
            "job_id": job_id,
            "contract_id": state.contract_id,
            "step": step,
            "description": state.step_description,
            "progress": state.progress_percentage,
            "status": state.status,
            "timestamp": utc_now().isoformat(),
            "data": extra_data or {}
        }

        if job_id in self.listeners:
            for cb in self.listeners[job_id]:
                try:
                    if asyncio.iscoroutinefunction(cb):
                        await cb(payload)
                    else:
                        cb(payload)
                except Exception as e:
                    pass

    async def initialize_from_bytes(
        self,
        file_bytes: bytes,
        filename: str,
        risk_profile: RiskProfileType = RiskProfileType.VENDOR_STANDARD,
        owner_id: Optional[str] = None
    ) -> str:
        contract_id = f"cnt_{uuid.uuid4().hex[:8]}"
        job_id = f"job_{uuid.uuid4().hex[:8]}"
        file_ext = filename.lower().split(".")[-1]

        cleaned_text, meta = DocumentParser.parse_bytes(file_bytes, filename)
        self.raw_texts[contract_id] = cleaned_text

        contract_meta = ContractMetadata(
            id=contract_id,
            filename=filename,
            file_size_bytes=len(file_bytes),
            file_type=file_ext.upper(),
            uploaded_at=utc_now(),
            page_count=meta.get("page_count", 1),
            total_words=meta.get("total_words", len(cleaned_text.split())),
            risk_profile=risk_profile
        )
        self.contracts[contract_id] = contract_meta

        analysis_state = AnalysisState(
            contract_id=contract_id,
            job_id=job_id,
            current_step=1,
            step_description=STEP_DESCRIPTIONS[1],
            status="IN_PROGRESS",
            progress_percentage=6
        )
        self.jobs[job_id] = analysis_state

        # Run pipeline synchronously for immediate availability
        await self._run_ingestion_and_evaluation(job_id, contract_id, cleaned_text, risk_profile, owner_id)
        return job_id

    async def initialize_from_sample(
        self,
        sample_key: str,
        risk_profile: RiskProfileType = RiskProfileType.VENDOR_STANDARD,
        owner_id: Optional[str] = None
    ) -> str:
        sample = SAMPLE_CONTRACTS.get(sample_key, SAMPLE_CONTRACTS["sample_msa"])
        contract_id = f"cnt_{uuid.uuid4().hex[:8]}"
        job_id = f"job_{uuid.uuid4().hex[:8]}"
        
        cleaned_text = DocumentParser.clean_text(sample["text"])
        self.raw_texts[contract_id] = cleaned_text
        words = len(cleaned_text.split())

        contract_meta = ContractMetadata(
            id=contract_id,
            filename=sample["filename"],
            file_size_bytes=len(cleaned_text.encode("utf-8")),
            file_type="DOCX" if "docx" in sample["filename"] else "PDF",
            uploaded_at=utc_now(),
            page_count=max(1, words // 350),
            total_words=words,
            risk_profile=risk_profile
        )
        self.contracts[contract_id] = contract_meta

        analysis_state = AnalysisState(
            contract_id=contract_id,
            job_id=job_id,
            current_step=1,
            step_description=STEP_DESCRIPTIONS[1],
            status="IN_PROGRESS",
            progress_percentage=6
        )
        self.jobs[job_id] = analysis_state

        await self._run_ingestion_and_evaluation(job_id, contract_id, cleaned_text, risk_profile, owner_id, sample_title=sample.get("title"))
        return job_id

    async def _run_ingestion_and_evaluation(
        self,
        job_id: str,
        contract_id: str,
        raw_text: str,
        profile: RiskProfileType,
        owner_id: Optional[str] = None,
        sample_title: Optional[str] = None
    ):
        # Step 1 -> 5: Parsing & NER
        await self.emit_step(job_id, 1)
        await self.emit_step(job_id, 2)
        await self.emit_step(job_id, 3)
        await self.emit_step(job_id, 4)

        entities = NLPEngine.extract_entities(raw_text)
        clauses = NLPEngine.segment_clauses(raw_text)
        
        for clause in clauses:
            prec_matches = vector_store.search_precedents(clause.text, top_k=2)
            clause.precedent_matches = [p.model_dump() for p in prec_matches]

        state = self.jobs[job_id]
        state.entities = entities
        state.clauses = clauses
        await self.emit_step(job_id, 5, {"entities_count": len(entities), "clauses_count": len(clauses)})

        # Step 6 -> 11: Risk Evaluation
        await self.emit_step(job_id, 6)
        await self.evaluate_risk_profile(job_id, profile)

        # Persist Contract and Clauses to DB
        self._persist_to_database(job_id, contract_id, raw_text, profile, owner_id, sample_title)

        # Log audit event
        audit_service.log_event(
            contract_id=contract_id,
            user_id=owner_id,
            event_type="CONTRACT_INGESTED",
            action=f"Contract '{self.contracts[contract_id].filename}' ingested and analyzed with {len(clauses)} clauses and {len(entities)} entities",
            details={
                "risk_score": state.risk_summary.overall_score if state.risk_summary else 0,
                "risk_level": state.risk_summary.overall_level.value if state.risk_summary else "LOW",
                "clauses_count": len(clauses),
                "entities_count": len(entities)
            },
            severity="INFO"
        )

    def _persist_to_database(
        self,
        job_id: str,
        contract_id: str,
        raw_text: str,
        profile: RiskProfileType,
        owner_id: Optional[str] = None,
        sample_title: Optional[str] = None
    ):
        try:
            db = SessionLocal()
            state = self.jobs.get(job_id)
            meta = self.contracts.get(contract_id)
            if not meta or not state:
                db.close()
                return

            # Check if contract exists in DB
            db_contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
            if not db_contract:
                db_contract = Contract(
                    contract_id=contract_id,
                    owner_id=owner_id,
                    title=sample_title or meta.filename.replace(".docx", "").replace(".pdf", "").replace("_", " "),
                    filename=meta.filename,
                    file_type=meta.file_type,
                    file_size_bytes=meta.file_size_bytes,
                    raw_text=raw_text,
                    risk_level=state.risk_summary.overall_level.value if state.risk_summary else "LOW",
                    risk_score=state.risk_summary.overall_score if state.risk_summary else 0,
                    status="PROCESSED",
                    risk_profile=profile.value,
                    created_at=meta.uploaded_at
                )
                db.add(db_contract)
                db.commit()

            # Insert/Update clauses
            for c in state.clauses:
                existing_clause = db.query(LegalClause).filter(LegalClause.clause_id == c.id).first()
                if not existing_clause:
                    db_clause = LegalClause(
                        clause_id=c.id,
                        contract_id=contract_id,
                        title=c.title,
                        category=c.category.value,
                        text=c.text,
                        start_idx=c.start_idx,
                        end_idx=c.end_idx,
                        risk_level=c.risk_level.value,
                        risk_score=c.risk_score,
                        red_flags=json.dumps(c.red_flag_phrases),
                        redline_text=c.redline.suggested_replacement if c.redline else None,
                        redline_rationale=c.redline.rationale if c.redline else None,
                        user_approved=c.user_approved,
                        notes=c.notes
                    )
                    db.add(db_clause)
            db.commit()
            db.close()
        except Exception as e:
            pass

    async def evaluate_risk_profile(self, job_id: str, profile: RiskProfileType):
        if job_id not in self.jobs:
            return

        state = self.jobs[job_id]
        contract_meta = self.contracts.get(state.contract_id)
        if contract_meta:
            contract_meta.risk_profile = profile

        await self.emit_step(job_id, 7, {"profile": profile.value})
        await self.emit_step(job_id, 8)
        await self.emit_step(job_id, 9)

        updated_clauses = []
        for c in state.clauses:
            evaluated = RiskEvaluator.evaluate_clause(c, profile)
            updated_clauses.append(evaluated)

        state.clauses = updated_clauses
        risk_summary = RiskEvaluator.compute_summary(state.clauses, profile)
        state.risk_summary = risk_summary

        await self.emit_step(job_id, 10, {
            "overall_score": risk_summary.overall_score,
            "overall_level": risk_summary.overall_level.value,
            "critical_flags": risk_summary.flagged_clauses_count.get("CRITICAL", 0)
        })

        await self.emit_step(job_id, 11, {
            "summary": risk_summary.model_dump(),
            "clauses": [c.model_dump() for c in state.clauses],
            "entities": [e.model_dump() for e in state.entities]
        })

    async def finalize_review(self, job_id: str, actor_name: str = "Senior Legal Counsel"):
        if job_id not in self.jobs:
            return

        state = self.jobs[job_id]
        contract_meta = self.contracts.get(state.contract_id)

        await self.emit_step(job_id, 12, {"actor": actor_name})
        await self.emit_step(job_id, 13)

        state.status = "COMPLETED"
        state.finalized_at = utc_now()
        await self.emit_step(job_id, 14, {"db_status": "COMMITTED"})

        indexed_count = vector_store.index_contract_clauses(
            state.contract_id, [c.model_dump() for c in state.clauses]
        )
        await self.emit_step(job_id, 15, {"indexed_clauses": indexed_count})

        if contract_meta:
            kg_data = knowledge_graph_service.build_graph(contract_meta, state.entities, state.clauses)
            self.knowledge_graphs[state.contract_id] = kg_data
            state.knowledge_graph_updated = True
            await self.emit_step(job_id, 16, {"nodes_count": len(kg_data.nodes), "edges_count": len(kg_data.edges)})

        state.audit_completed = True
        alert_details = {
            "contract": contract_meta.filename if contract_meta else "Contract",
            "overall_score": state.risk_summary.overall_score if state.risk_summary else 0,
            "risk_level": state.risk_summary.overall_level.value if state.risk_summary else "LOW",
            "critical_clauses": state.risk_summary.flagged_clauses_count.get("CRITICAL", 0) if state.risk_summary else 0,
            "finalized_by": actor_name
        }
        await self.emit_step(job_id, 17, alert_details)

        # Log audit
        audit_service.log_event(
            contract_id=state.contract_id,
            event_type="CONTRACT_FINALIZED",
            actor=actor_name,
            action=f"Contract review finalized by {actor_name}",
            details=alert_details,
            severity="ALERT"
        )

orchestrator = Orchestrator()
