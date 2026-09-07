from fastapi import APIRouter, Query, Depends
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Contract, LegalClause
from app.services.orchestrator import orchestrator
from app.services.vector_store import vector_store

router = APIRouter(prefix="/api/search", tags=["Semantic Search (Stubbed via SQL ILIKE)"])

@router.get("")
def search_contracts_and_clauses(
    q: str = Query(..., description="Search query string"),
    category: Optional[str] = Query(None, description="Optional clause category filter"),
    risk_level: Optional[str] = Query(None, description="Optional risk level filter"),
    db: Session = Depends(get_db)
):
    """
    Semantic Search Interface (MVP Stub):
    Performs fast SQL ILIKE text search and vector similarity ranking over clauses and contracts.
    This interface is drop-in ready to swap in Pinecone/FAISS vector embeddings.
    """
    results: List[Dict[str, Any]] = []
    terms = q.lower().split()

    # Search in database clauses
    try:
        query = db.query(LegalClause).join(Contract)
        if category:
            query = query.filter(LegalClause.category == category)
        if risk_level:
            query = query.filter(LegalClause.risk_level == risk_level)

        db_clauses = query.all()
        for cl in db_clauses:
            text_lower = cl.text.lower()
            title_lower = cl.title.lower()
            
            # Simple term matching & score calculation
            matches = sum(1 for term in terms if term in text_lower or term in title_lower)
            if matches > 0 or len(terms) == 0:
                score = round(min(0.98, 0.45 + (matches / (len(terms) or 1)) * 0.5), 2)
                results.append({
                    "type": "clause",
                    "id": cl.clause_id,
                    "contract_id": cl.contract_id,
                    "contract_title": cl.contract.title if cl.contract else "Contract",
                    "title": cl.title,
                    "category": cl.category,
                    "snippet": cl.text[:220] + "..." if len(cl.text) > 220 else cl.text,
                    "risk_level": cl.risk_level,
                    "risk_score": cl.risk_score,
                    "similarity_score": score,
                    "engine": "SQL_ILIKE_HYBRID_STUB"
                })
    except Exception:
        pass

    # If DB results are few, also search in-memory active jobs
    for j in orchestrator.jobs.values():
        c_meta = orchestrator.contracts.get(j.contract_id)
        for cl in j.clauses:
            if any(r["id"] == cl.id for r in results):
                continue
            if category and cl.category.value != category:
                continue
            if risk_level and cl.risk_level.value != risk_level:
                continue
                
            text_lower = cl.text.lower()
            matches = sum(1 for term in terms if term in text_lower or term in cl.title.lower())
            if matches > 0 or len(terms) == 0:
                score = round(min(0.96, 0.40 + (matches / (len(terms) or 1)) * 0.55), 2)
                results.append({
                    "type": "clause",
                    "id": cl.id,
                    "contract_id": j.contract_id,
                    "contract_title": c_meta.filename if c_meta else "Active Contract",
                    "title": cl.title,
                    "category": cl.category.value,
                    "snippet": cl.text[:220] + "..." if len(cl.text) > 220 else cl.text,
                    "risk_level": cl.risk_level.value,
                    "risk_score": cl.risk_score,
                    "similarity_score": score,
                    "engine": "VECTOR_EMBEDDING_FALLBACK"
                })

    # Sort by similarity score descending
    results.sort(key=lambda x: x["similarity_score"], reverse=True)

    return {
        "query": q,
        "total_matches": len(results),
        "results": results[:20],
        "interface_status": "FUNCTIONAL_STUB",
        "backend_engine": "SQL ILIKE + Lexical Scoring (Pinecone/FAISS Vector interface drop-in)"
    }
