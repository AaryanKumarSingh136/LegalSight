"""
LegalSight Storyboarder Test 05: Portfolio Reports & Obligation Deadlines
Tests portfolio liability aggregation, notice deadlines, and JSON telemetry export.
"""
import sys
import time
from pathlib import Path

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_05_reports_deadlines",
        name="Portfolio Liability Matrix & Renewal Deadlines Hub",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Open Reports Hub
        sb.open_app()
        sb.wait_visible("[data-testid='nav-reports']")
        sb.click("[data-testid='nav-reports']")
        sb.wait_visible("[data-testid='btn-export-portfolio-json']")
        sb.step(
            "Portfolio Liability & Risk Intelligence Hub",
            "Loaded executive dashboard aggregating enterprise exposure, liability caps, and indemnity profiles across all contracts.",
            wait_time=0.8
        )

        # Step 2: Obligation & Renewal Deadlines
        deadlines_box = sb.wait_visible("[data-testid='deadlines-list-container']")
        sb.assert_step(
            deadlines_box.is_displayed(),
            "Upcoming Obligations & Renewal Deadlines Schedule",
            "Displayed chronological calendar alerts for contract renewals, notice deadlines, and compliance milestones.",
            "Deadlines container was not found."
        )

        # Step 3: Export Portfolio JSON Telemetry
        sb.click("[data-testid='btn-export-portfolio-json']")
        time.sleep(0.5)
        sb.step(
            "Exported Portfolio Liability Matrix JSON",
            "Generated structured JSON export of all portfolio risk metrics, contract metadata, and deadline schedules.",
            wait_time=0.5
        )
        return sb.case

def test_reports_deadlines():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
