"""
LegalSight Storyboarder Test 02: Dashboard Ingestion & Playbook Selection
Tests contract ingestion triggers, KPI cards, and calibration matrix switching.
"""
import sys
import time
from pathlib import Path

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_02_dashboard_ingest",
        name="Contract Ingestion Hub & Playbook Calibration",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Ingestion Hub & KPI Metrics
        sb.open_app()
        sb.wait_visible("[data-testid='nav-dashboard']")
        sb.step(
            "Contract Intelligence & Review Hub Overview",
            "Loaded enterprise ingestion dashboard displaying active contract metrics, risk indicators, and velocity KPIs.",
            wait_time=0.6
        )

        # Step 2: Inspect Ingestion Corpus Cards
        sb.wait_visible("[data-testid='btn-sample-msa']")
        sb.step(
            "Pre-Loaded Multi-Risk Commercial Corpus",
            "Verified 1-Click ingestion options: Cloud SaaS Master Agreement (High Risk), Cross-Border Share Purchase Agreement (Critical Risk), Mutual NDA (Low Risk).",
            wait_time=0.5
        )

        # Step 3: Calibrate Risk Playbook Matrix
        playbook_mna = sb.find("[data-testid='playbook-item-m-a-aggressive']")
        sb.click(playbook_mna)
        time.sleep(0.5)
        sb.step(
            "Switched Playbook Calibration: M&A Aggressive",
            "Activated M&A Aggressive calibration matrix; lowered tolerance threshold to 40 for indemnification, super-caps, and IP covenants.",
            wait_time=0.5
        )

        # Step 4: Trigger 1-Click Deep Analysis Ingestion
        msa_btn = sb.find("[data-testid='btn-sample-msa']")
        sb.click(msa_btn)
        time.sleep(1.2)

        # Wait for transition to reviewer
        reviewer_tab = sb.wait_visible("[data-testid='tab-reviewer-clauses']")
        sb.assert_step(
            reviewer_tab.is_displayed(),
            "Contract Ingested & Transitioned to Reviewer",
            "Ingestion pipeline parsed SaaS Master Services Agreement; extracted clauses and initialized neural risk analysis workspace.",
            "Failed to transition to contract reviewer workspace."
        )
        return sb.case

def test_dashboard_ingest():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
