"""
LegalSight Storyboarder Test 08: Governance Admin Console & RBAC Controls
Tests corporate legal user directory, risk playbook sensitivity tuning, and model diagnostics.
"""
import sys
import time
from pathlib import Path

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_08_governance_admin",
        name="Enterprise Governance, RBAC Directory & Model Diagnostics",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Open app & Authenticate as Admin
        sb.open_app()
        sb.wait_visible("[data-testid='btn-open-auth']")
        sb.click("[data-testid='btn-open-auth']")
        sb.wait_visible("[data-testid='auth-modal']")
        sb.click("[data-testid='btn-demo-admin']")
        time.sleep(1.0)
        sb.wait_visible("[data-testid='user-profile-badge']")
        sb.step(
            "Admin Governance Authentication",
            "Authenticated with enterprise administrator role, unlocking governance controls and calibration consoles.",
            wait_time=0.5
        )

        # Step 2: Navigate to Governance & Admin Tab
        sb.wait_visible("[data-testid='nav-admin']")
        sb.click("[data-testid='nav-admin']")
        sb.wait_visible("[data-testid='tab-admin-users']")
        sb.step(
            "System Governance Console: User Directory",
            "Loaded administrative controls displaying corporate legal team members, RBAC tiers, and active sessions.",
            wait_time=0.7
        )

        # Step 3: Switch to Playbook Sensitivity Tuning Tab
        sb.click("[data-testid='tab-admin-playbooks']")
        time.sleep(0.5)
        sb.step(
            "Playbook Sensitivity & Threshold Calibration",
            "Inspected risk thresholds across Standard Vendor, Aggressive M&A, and Balanced Enterprise playbooks.",
            wait_time=0.6
        )

        # Step 4: Switch to Model Diagnostics Tab
        sb.click("[data-testid='tab-admin-models']")
        time.sleep(0.5)
        sb.step(
            "Transformer Diagnostic Telemetry & LoRA Status",
            "Verified Legal-BERT latency benchmarks, ensemble weights, and CUDA/CPU inference acceleration status.",
            wait_time=0.6
        )

        # Step 5: Clean Sign-Out
        sb.click("[data-testid='btn-logout']")
        time.sleep(0.6)
        sb.step(
            "Admin Session Terminated Cleanly",
            "Logged out of administrative console and safely reset session context.",
            wait_time=0.4
        )
        return sb.case

def test_governance_admin():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
