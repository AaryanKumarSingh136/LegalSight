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
