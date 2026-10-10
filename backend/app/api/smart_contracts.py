from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List
from app.services.smart_contract_stub import SmartContract
from app.services.orchestrator import orchestrator

router = APIRouter(prefix="/api/smart-contracts", tags=["Smart Contracts Execution (Stubbed)"])

# In-memory store for active smart contract instances
smart_contract_registry: Dict[str, SmartContract] = {}

@router.post("/draft/{contract_id}")
def draft_smart_contract(contract_id: str):
    """
    Draft an automated Smart Contract with execution rules from an analyzed contract.
    """
    contract_meta = orchestrator.contracts.get(contract_id)
    contract_name = contract_meta.filename if contract_meta else f"Agreement_{contract_id}"

    sc = SmartContract(contract_id=contract_id, name=contract_name)
    draft_result = sc.draftContract(clauses_metadata=[])
    smart_contract_registry[contract_id] = sc

    return {
        "contract_id": contract_id,
        "smart_contract": sc.queryState(),
        "draft_summary": draft_result,
        "message": "Smart contract execution rules compiled successfully (Solidity ABI ready)."
    }

@router.post("/deploy/{contract_id}")
def deploy_smart_contract(contract_id: str, payload: Dict[str, Any] = Body(default={})):
    """
    Simulate deploying the smart contract to Ethereum Sepolia testnet.
    """
    sc = smart_contract_registry.get(contract_id)
    if not sc:
        # Create and draft on the fly
        sc = SmartContract(contract_id=contract_id, name=f"Contract_{contract_id}")
        sc.draftContract([])
        smart_contract_registry[contract_id] = sc

    gas_limit = payload.get("gas_limit", 2500000)
    deployment = sc.deployToBlockchain(gas_limit=gas_limit)

    return {
        "contract_id": contract_id,
        "deployment": deployment,
        "smart_contract": sc.queryState()
    }

@router.get("/status/{contract_id}")
def get_smart_contract_status(contract_id: str):
    """
    Retrieve on-chain state and execution rules of a smart contract.
    """
    sc = smart_contract_registry.get(contract_id)
    if not sc:
        # Provide default stubbed blueprint
        sc = SmartContract(contract_id=contract_id, name=f"Contract_{contract_id}")
        sc.draftContract([])
        smart_contract_registry[contract_id] = sc

    return {
        "contract_id": contract_id,
        "smart_contract": sc.queryState()
    }

@router.post("/trigger/{contract_id}")
def execute_smart_contract_trigger(contract_id: str, payload: Dict[str, Any] = Body(default={})):
    """
    Execute an automated on-chain payment trigger or oracle event (e.g. SLA Breach or Escrow Release).
    """
    sc = smart_contract_registry.get(contract_id)
    if not sc:
        sc = SmartContract(contract_id=contract_id, name=f"Contract_{contract_id}")
        sc.draftContract([])
        smart_contract_registry[contract_id] = sc

    trigger_name = payload.get("trigger_name", "SLA_BREACH_PENALTY")
    receipt = sc.execute_trigger(trigger_name, payload)

    return {
        "contract_id": contract_id,
        "receipt": receipt,
        "smart_contract": sc.queryState()
    }

