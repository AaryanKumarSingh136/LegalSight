from fastapi import APIRouter, Query
from typing import List
from app.models.schemas import PrecedentResult
from app.services.vector_store import vector_store

router = APIRouter(prefix="/api/precedents", tags=["Vector Store & Precedents"])

@router.get("/search", response_model=List[PrecedentResult])
def search_precedents(
    query: str = Query(..., min_length=2),
    top_k: int = Query(3, ge=1, le=10)
):
    """Execute semantic cosine similarity search against indexed legal precedents."""
    return vector_store.search_precedents(query_text=query, top_k=top_k)

@router.get("/all")
def list_all_precedents():
    """Retrieve full database of landmark benchmark precedents."""
    return {"precedents": vector_store.precedents}
