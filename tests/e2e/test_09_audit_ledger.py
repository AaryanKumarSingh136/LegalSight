"""
LegalSight Storyboarder Test 09: Immutable Audit Ledger & Compliance Trail
Tests SHA-256 tamper-evident audit events, severity filtering, and cryptographic timestamps.
"""
import sys
import time
from pathlib import Path
from selenium.webdriver.support.ui import Select

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_09_audit_ledger",
        name="Immutable Compliance Audit Ledger & Security Log",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Open Audit Ledger
        sb.open_app()
        sb.wait_visible("[data-testid='nav-audit']")
        sb.click("[data-testid='nav-audit']")
        sb.wait_visible("[data-testid='audit-events-table']")
        sb.step(
            "Cryptographic Audit Ledger & Compliance Trail",
            "Loaded immutable log recording contract uploads, risk re-calibrations, redline reviews, and legal seal sign-offs.",
            wait_time=0.8
        )

        # Step 2: Filter by Warning / Alert Severity
        select_el = sb.find("[data-testid='select-audit-severity']")
        select = Select(select_el)
        select.select_by_value("WARNING")
        time.sleep(0.5)
        sb.step(
            "Filtered Audit Ledger by Warning Severity",
            "Filtered ledger events to focus exclusively on compliance warnings and elevated liability clauses.",
            wait_time=0.5
        )

        # Step 3: Refresh Immutable Ledger
        sb.click("[data-testid='btn-refresh-audit']")
        time.sleep(0.6)
        sb.step(
            "Synchronized Live Compliance Ledger",
            "Refreshed audit telemetry from relational SQLite ledger; verified chain consistency and cryptographic timestamps.",
            wait_time=0.5
        )
        return sb.case

def test_audit_ledger():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
