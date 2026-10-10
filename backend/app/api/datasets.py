from fastapi import APIRouter, Query, Body, HTTPException
from typing import Optional, Dict, Any, List
from app.services.dataset_loader import (
    dataset_loader,
    DatasetBenchmarkSummary,
    DatasetProvision,
    NLIHypothesisCheck
)

router = APIRouter(prefix="/api/datasets", tags=["Legal Datasets & Model Benchmarks"])

@router.get("/summary", response_model=DatasetBenchmarkSummary)
def get_dataset_summary():
    """
    Return comprehensive statistics of loaded open-source legal datasets
    (CUAD, MAUD, LEDGAR, ContractNLI, LexGLUE, SEC-EDGAR).
    """
    return dataset_loader.get_summary()

@router.get("/provisions")
def list_dataset_provisions(
    dataset_name: Optional[str] = Query(None, description="Filter by dataset (CUAD, MAUD, LEDGAR, ContractNLI, LexGLUE, SEC-EDGAR)"),
    category: Optional[str] = Query(None, description="Filter by clause category"),
    keyword: Optional[str] = Query(None, description="Filter by text keyword or tag")
):
    """
    Retrieve curated benchmark provisions from open-source legal corpora.
    """
    provisions = dataset_loader.query_provisions(
        dataset_name=dataset_name,
        category=category,
        keyword=keyword
    )
    return {
        "total": len(provisions),
        "provisions": [p.model_dump() for p in provisions]
    }

@router.post("/verify-nli")
def verify_nli_hypotheses(payload: Dict[str, Any] = Body(...)):
    """
    Evaluate clause text against standard ContractNLI legal hypotheses
    (Duration, Return of Materials, Liability Cap, Mutual Indemnity, etc.).
    """
    clause_text = payload.get("clause_text", "").strip()
    if not clause_text:
        raise HTTPException(status_code=400, detail="clause_text is required.")

    checks = dataset_loader.verify_nli_hypotheses(clause_text)
    return {
        "clause_text_snippet": clause_text[:120] + "..." if len(clause_text) > 120 else clause_text,
        "hypotheses_evaluated": len(checks),
        "results": [c.model_dump() for c in checks]
    }

@router.get("/models")
def list_supported_models():
    """
    List available legal NLP and Transformer models with benchmark metrics
    (CUAD F1, LEDGAR F1, LexGLUE F1, parameter counts, latency).
    """
    models = dataset_loader.get_supported_models()
    return {
        "total_models": len(models),
        "models": models
    }

@router.post("/models/evaluate")
def evaluate_clause_with_model(payload: Dict[str, Any] = Body(...)):
    """
    Execute benchmark inference on a selected legal model for an input clause.
    """
    model_id = payload.get("model_id", "legalsight-ensemble")
    clause_text = payload.get("clause_text", "").strip()
    if not clause_text:
        raise HTTPException(status_code=400, detail="clause_text is required.")

    result = dataset_loader.evaluate_clause_with_model(model_id, clause_text)
    return result
