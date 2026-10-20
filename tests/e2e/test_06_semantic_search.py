"""
LegalSight Storyboarder Test 06: Semantic Legal Search & Precedent Hub
Tests neural similarity querying, quick-search filter chips, and precedent retrieval.
"""
import sys
import time
from pathlib import Path

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_06_semantic_search",
        name="Semantic Legal Search & Precedent Discovery",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Open Semantic Search Hub
        sb.open_app()
        sb.wait_visible("[data-testid='nav-search']")
        sb.click("[data-testid='nav-search']")
        sb.wait_visible("[data-testid='search-query-input']")
        sb.step(
            "Semantic Legal Search & Precedent Console",
            "Loaded vector search interface for cross-contract precedent matching and clause similarity indexing.",
            wait_time=0.7
        )

        # Step 2: Enter Custom Legal Query
        sb.type_text("[data-testid='search-query-input']", "limitation of liability super-cap carve-out")
        time.sleep(0.4)
        sb.step(
            "Targeted Query Specification",
            "Input search query for super-cap carve-out precedents across commercial agreement corpus.",
            wait_time=0.4
        )

        # Step 3: Execute Semantic Search
        sb.click("[data-testid='btn-submit-search']")
        time.sleep(0.8)

        results_list = sb.wait_visible("[data-testid='search-results-list']")
        sb.assert_step(
            results_list.is_displayed(),
            "Vector Similarity Matches Retrieved",
            "Retrieved matching clauses ranked by semantic relevance, risk score, and originating agreement.",
            "Search results list not displayed."
        )

        # Step 4: Quick Query Chip Trigger
        chip = sb.find("[data-testid='quick-query-uncapped-indemnity']")
        sb.click(chip)
        time.sleep(0.8)
        sb.step(
            "1-Click Precedent Preset: Uncapped Indemnity",
            "Executed rapid query for uncapped indemnification provisions across all indexed vendor agreements.",
            wait_time=0.5
        )
        return sb.case

def test_semantic_search():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
