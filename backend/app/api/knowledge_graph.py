from fastapi import APIRouter, HTTPException
from app.models.schemas import KnowledgeGraphData
from app.services.orchestrator import orchestrator

router = APIRouter(prefix="/api/knowledge-graph", tags=["Legal Knowledge Graph"])

@router.get("/contract/{contract_id}", response_model=KnowledgeGraphData)
def get_contract_graph(contract_id: str):
    """Retrieve topological nodes and relationship edges for a contract."""
    if contract_id in orchestrator.knowledge_graphs:
        return orchestrator.knowledge_graphs[contract_id]
    
    # If not yet generated, build dynamically if contract exists
    if contract_id in orchestrator.contracts:
        # Find matching job
        matching_job = next((j for j in orchestrator.jobs.values() if j.contract_id == contract_id), None)
        if matching_job:
            from app.services.knowledge_graph import knowledge_graph_service
            kg = knowledge_graph_service.build_graph(
                orchestrator.contracts[contract_id],
                matching_job.entities,
                matching_job.clauses
            )
            orchestrator.knowledge_graphs[contract_id] = kg
            return kg

    raise HTTPException(status_code=404, detail="Knowledge graph not found for this contract ID.")
