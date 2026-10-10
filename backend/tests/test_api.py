import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.sample_contracts.contracts import SAMPLE_CONTRACTS
from app.db.database import Base, engine, SessionLocal
from app.services.auth_service import AuthService

# Initialize database tables and seed users
Base.metadata.create_all(bind=engine)
db = SessionLocal()
AuthService.seed_demo_users(db)
db.close()

client = TestClient(app)

def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "LegalSight" in data["service"]

def test_auth_flow():
    # Login with seeded analyst
    login_res = client.post("/api/auth/login", json={
        "username_or_email": "analyst",
        "password": "password123"
    })
    assert login_res.status_code == 200
    auth_data = login_res.json()
    assert "access_token" in auth_data
    token = auth_data["access_token"]
    assert auth_data["user"]["role"] == "Analyst"

    # Test /me endpoint
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "analyst"

    # Signup a new user
    signup_res = client.post("/api/auth/signup", json={
        "username": "tester_analyst",
        "email": "tester@legalsight.ai",
        "password": "securepassword123",
        "role": "Analyst"
    })
    assert signup_res.status_code in [200, 400]

def test_get_sample_contracts():
    response = client.get("/api/contracts/samples")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert len(data["samples"]) >= 3

def test_load_sample_and_pipeline_execution():
    # Load MSA sample
    response = client.post("/api/contracts/load-sample/sample_msa")
    assert response.status_code == 200
    data = response.json()
    job_id = data["job_id"]
    contract_id = data["contract_id"]
    assert job_id.startswith("job_")

    # Fetch job state
    job_res = client.get(f"/api/analysis/job/{job_id}")
    assert job_res.status_code == 200
    job_data = job_res.json()
    assert job_data["contract_id"] == contract_id
    assert len(job_data["entities"]) > 0
    assert len(job_data["clauses"]) > 0
    assert job_data["risk_summary"] is not None

    # Test profile re-evaluation
    eval_res = client.post(
        f"/api/analysis/job/{job_id}/re-evaluate",
        json={"risk_profile": "M&A Aggressive"}
    )
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["risk_profile"] == "M&A Aggressive"
    assert eval_data["risk_summary"]["overall_score"] >= 0

    # Test clause approval
    first_clause_id = job_data["clauses"][0]["id"]
    appr_res = client.post(
        f"/api/analysis/job/{job_id}/clause/{first_clause_id}/approve",
        json={"notes": "Reviewed and approved by test."}
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["user_approved"] is True

    # Test clause redline update
    redline_res = client.post(
        f"/api/analysis/job/{job_id}/clause/{first_clause_id}/redline",
        json={"replacement_text": "Updated balanced clause text.", "rationale": "Test rationale"}
    )
    assert redline_res.status_code == 200
    assert redline_res.json()["replacement_text"] == "Updated balanced clause text."

    # Test PDF report export
    pdf_res = client.get(f"/api/export/pdf/{job_id}")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 500

    # Test JSON summary export
    json_res = client.get(f"/api/export/summary/{job_id}")
    assert json_res.status_code == 200
    assert "analysis_state" in json_res.json()

def test_semantic_search_stub():
    res = client.get("/api/search?q=indemnity+liability")
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert "interface_status" in data

def test_smart_contracts_stub():
    # Draft smart contract
    draft_res = client.post("/api/smart-contracts/draft/cnt_sample_msa")
    assert draft_res.status_code == 200
    draft_data = draft_res.json()
    assert "smart_contract" in draft_data

    # Deploy smart contract simulation
    deploy_res = client.post("/api/smart-contracts/deploy/cnt_sample_msa", json={"gas_limit": 2000000})
    assert deploy_res.status_code == 200
    deploy_data = deploy_res.json()
    assert deploy_data["deployment"]["status"] == "DEPLOYED"
    assert "contract_address" in deploy_data["deployment"]

def test_admin_and_reports_stubs():
    # Admin users list
    admin_res = client.get("/api/admin/users")
    assert admin_res.status_code == 200
    assert len(admin_res.json()["users"]) >= 1

    # Playbooks settings
    pb_res = client.get("/api/admin/playbooks")
    assert pb_res.status_code == 200
    assert len(pb_res.json()["playbooks"]) >= 3

    # Reporting portfolio
    rep_res = client.get("/api/reports/portfolio")
    assert rep_res.status_code == 200
    assert "portfolio_super_cap_exposure" in rep_res.json()["metrics"]

    # Deadline tracker
    dl_res = client.get("/api/reports/deadlines")
    assert dl_res.status_code == 200
    assert len(dl_res.json()["deadlines"]) >= 2

def test_audit_logs():
    res = client.get("/api/audit/events")
    assert res.status_code == 200
    events = res.json()
    assert len(events) > 0

def test_datasets_and_models_endpoints():
    # 1. Dataset summary
    sum_res = client.get("/api/datasets/summary")
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert sum_data["total_datasets"] >= 4
    assert sum_data["total_provisions"] >= 10

    # 2. Provisions query
    prov_res = client.get("/api/datasets/provisions?dataset_name=CUAD")
    assert prov_res.status_code == 200
    prov_data = prov_res.json()
    assert prov_data["total"] >= 1
    assert "clause_text" in prov_data["provisions"][0]

    # 3. NLI verification
    nli_res = client.post("/api/datasets/verify-nli", json={
        "clause_text": "Customer shall indemnify and defend Provider without financial cap from and against all liabilities in perpetuity."
    })
    assert nli_res.status_code == 200
    nli_data = nli_res.json()
    assert nli_data["hypotheses_evaluated"] > 0
    # Should detect contradiction on uncapped liability or perpetuity
    labels = [r["label"] for r in nli_data["results"]]
    assert "CONTRADICTION" in labels or "ENTAILMENT" in labels

    # 4. Model listing
    models_res = client.get("/api/datasets/models")
    assert models_res.status_code == 200
    models_data = models_res.json()
    assert models_data["total_models"] >= 4

    # 5. Live Model Evaluation
    eval_res = client.post("/api/datasets/models/evaluate", json={
        "model_id": "legal-bert",
        "clause_text": "Each party shall indemnify, defend and hold harmless the other party against patent infringement claims."
    })
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["evaluated_category"] == "Indemnity & Hold Harmless"
    assert eval_data["confidence_score"] > 0.8
    assert "inference_time_ms" in eval_data

def test_smart_contracts_solidity_and_trigger():
    draft_res = client.post("/api/smart-contracts/draft/cnt_sample_msa")
    assert draft_res.status_code == 200
    assert "solidity_code" in draft_res.json()["draft_summary"]
    assert "pragma solidity ^0.8.24" in draft_res.json()["draft_summary"]["solidity_code"]

    # Test trigger execution
    trig_res = client.post("/api/smart-contracts/trigger/cnt_sample_msa", json={
        "trigger_name": "SLA_BREACH_PENALTY"
    })
    assert trig_res.status_code == 200
    receipt = trig_res.json()["receipt"]
    assert receipt["status"] == "CONFIRMED"
    assert "event_emitted" in receipt

