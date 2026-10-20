"""
LegalSight Storyboarder Test 03: Reviewer Analysis & Certified Legal Seal Sign-Off
Tests split-pane document viewer, risk radar score, redline comparisons, and certified sign-off.
"""
import sys
import time
from pathlib import Path

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_03_reviewer_analysis",
        name="Contract Reviewer, Redline Diff & Legal Seal Sign-Off",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Open Reviewer Tab
        sb.open_app()
        sb.wait_visible("[data-testid='nav-reviewer']")
        sb.click("[data-testid='nav-reviewer']")
        sb.wait_visible("[data-testid='tab-reviewer-clauses']")
        sb.step(
            "Split-Pane Legal Reviewer Workspace",
            "Loaded contract reviewer displaying full source text on left and neural clause cards with risk radar on right.",
            wait_time=0.8
        )

        # Step 2: Switch to Executive Summary Tab
        sb.click("[data-testid='tab-reviewer-summary']")
        time.sleep(0.5)
        sb.step(
            "General Counsel Synthesis & Risk Radar",
            "Synthesized contract risk overview, key exposure warnings, and compliance scores.",
            wait_time=0.5
        )

        # Step 3: Switch to Named Entity Recognition (NER)
        sb.click("[data-testid='tab-reviewer-entities']")
        time.sleep(0.5)
        sb.step(
            "Extracted Entities & Legal Metadata",
            "Extracted contracting parties, governing jurisdiction, liability ceilings, and termination provisions.",
            wait_time=0.5
        )

        # Step 4: Inspect Redline Diff in Clause View
        sb.click("[data-testid='tab-reviewer-clauses']")
        time.sleep(0.5)
        sb.step(
            "Clause Cards & Proposed Redline Alternatives",
            "Viewed side-by-side redlines comparing original problematic clause against market-standard harmonized text.",
            wait_time=0.5
        )

        # Step 5: Open Certified Legal Sign-Off Modal
        sb.click("[data-testid='btn-open-signoff']")
        sb.wait_visible("[data-testid='signoff-modal']")
        sb.step(
            "Counsel Sign-Off Certification Modal",
            "Opened certified approval dialog requiring counsel credentials, firm attribution, and audit confirmation.",
            wait_time=0.5
        )

        # Fill out sign-off form
        sb.type_text("[data-testid='input-signoff-name']", "Eleanor Vance, Esq.")
        sb.type_text("[data-testid='input-signoff-title']", "Senior General Counsel")
        sb.type_text("[data-testid='input-signoff-notes']", "Approved subject to negotiated 12-month super-cap provision.")
        time.sleep(0.4)

        # Step 6: Execute Certified Sign-Off
        sb.click("[data-testid='btn-execute-signoff']")
        time.sleep(0.8)

        # Verify Gold Legal Seal Stamp is rendered
        seal = sb.wait_visible("[data-testid='legal-seal-stamp']")
        sb.assert_step(
            seal.is_displayed(),
            "Gold Holographic Legal Seal & Certified Stamp",
            "Successfully minted certified digital sign-off seal with cryptographic hash and counsel credentials.",
            "Legal seal stamp was not displayed."
        )
        return sb.case

def test_reviewer_analysis():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
