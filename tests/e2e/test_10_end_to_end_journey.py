"""
LegalSight Storyboarder Test 10: End-to-End Enterprise Legal Counsel Journey
Simulates full commercial lifecycle: Ingestion -> Neural Review -> Redline -> Legal Seal -> Portfolio Report -> Smart Contract -> Audit Verification.
"""
import sys
import time
from pathlib import Path

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_10_end_to_end_journey",
        name="Complete Enterprise Legal Counsel End-to-End Lifecycle",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Landing Page & Workspace Initialization
        sb.open_app()
        sb.wait_visible("[data-testid='nav-dashboard']")
        sb.step(
            "Phase 1: Enterprise Workspace Initialization",
            "Counsel navigates to LegalSight contract intelligence suite; dashboard displays real-time portfolio metrics.",
            wait_time=0.6
        )

        # Step 2: Analyst Authentication
        sb.click("[data-testid='btn-open-auth']")
        sb.wait_visible("[data-testid='auth-modal']")
        sb.click("[data-testid='btn-demo-analyst']")
        time.sleep(1.0)
        sb.wait_visible("[data-testid='user-profile-badge']")
        sb.step(
            "Phase 2: Authenticated Legal Counsel Session",
            "Logged in as Senior Contract Analyst with full redaction and redline proposal privileges.",
            wait_time=0.5
        )

        # Step 3: Calibrate Ingestion Playbook
        sb.click("[data-testid='playbook-item-m-a-aggressive']")
        time.sleep(0.5)
        sb.step(
            "Phase 3: Calibrate Risk Tolerance Matrix",
            "Calibrated risk sensitivity to M&A Aggressive standard, setting super-cap threshold at 40.",
            wait_time=0.5
        )

        # Step 4: Ingest Complex Commercial Contract
        sb.click("[data-testid='btn-sample-msa']")
        time.sleep(1.2)
        sb.wait_visible("[data-testid='tab-reviewer-clauses']")
        sb.step(
            "Phase 4: Neural Ingestion & Clause Segmentation",
            "Processed 4,200-word SaaS Master Agreement; identified 12 discrete provisions and 3 critical liability flags.",
            wait_time=0.7
        )

        # Step 5: Review Flagged Provisions & Redlines
        sb.click("[data-testid='tab-reviewer-summary']")
        time.sleep(0.5)
        sb.step(
            "Phase 5: Executive Risk Synthesis & Recommendations",
            "Reviewed AI-generated risk radar and executive summary detailing indemnification exposure.",
            wait_time=0.5
        )

        # Step 6: Execute Certified Legal Seal Sign-Off
        sb.click("[data-testid='btn-open-signoff']")
        sb.wait_visible("[data-testid='signoff-modal']")
        sb.type_text("[data-testid='input-signoff-name']", "Eleanor Vance, Esq.")
        sb.type_text("[data-testid='input-signoff-title']", "General Counsel")
        sb.type_text("[data-testid='input-signoff-notes']", "Finalized and certified for corporate execution.")
        time.sleep(0.4)
        sb.click("[data-testid='btn-execute-signoff']")
        time.sleep(0.8)
        sb.wait_visible("[data-testid='legal-seal-stamp']")
        sb.step(
            "Phase 6: Certified Holographic Legal Seal Minted",
            "Minted verifiable digital legal seal with certified counsel signature and cryptographic stamp.",
            wait_time=0.6
        )

        # Step 7: Inspect Updated Portfolio Liability Matrix
        sb.click("[data-testid='nav-reports']")
        sb.wait_visible("[data-testid='deadlines-list-container']")
        sb.step(
            "Phase 7: Portfolio Liability & Renewal Deadlines",
            "Inspected enterprise super-cap exposure and upcoming renewal notice deadlines across agreements.",
            wait_time=0.6
        )

        # Step 8: Synthesize EVM Smart Contract Code
        sb.click("[data-testid='nav-smart_contracts']")
        sb.wait_visible("[data-testid='btn-synthesize-rules']")
        sb.click("[data-testid='btn-synthesize-rules']")
        time.sleep(1.0)
        sb.click("[data-testid='tab-sc-solidity']")
        time.sleep(0.5)
        sb.step(
            "Phase 8: Synthesized Solidity 0.8.24 Smart Contract",
            "Generated EVM-compatible Solidity code mapping payment gates, SLA credits, and arbitration triggers.",
            wait_time=0.6
        )

        # Step 9: Verify Cryptographic Compliance Audit Trail
        sb.click("[data-testid='nav-audit']")
        sb.wait_visible("[data-testid='audit-events-table']")
        sb.step(
            "Phase 9: Immutable Audit Ledger Verification",
            "Verified complete end-to-end audit trail in compliance ledger with SHA-256 event timestamps.",
            wait_time=0.6
        )
        return sb.case

def test_end_to_end_journey():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
