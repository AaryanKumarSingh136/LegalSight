"""
LegalSight Storyboarder Test 04: Datasets Benchmarks & Model Evaluator
Tests Stanford CUAD/MAUD corpus explorer, Transformer model cards, and live neural evaluator.
"""
import sys
import time
from pathlib import Path

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_04_datasets_models",
        name="Legal Datasets, Benchmark Models & Neural Evaluator",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Open Datasets & Models Hub
        sb.open_app()
        sb.wait_visible("[data-testid='nav-datasets']")
        sb.click("[data-testid='nav-datasets']")
        sb.wait_visible("[data-testid='tab-datasets-provisions']")
        sb.step(
            "Benchmark Corpora & Provisions Explorer",
            "Loaded legal benchmark explorer displaying Stanford CUAD, MAUD, ContractNLI, and SEC Exhibit 10 datasets.",
            wait_time=0.7
        )

        # Step 2: Switch to Model Registry
        sb.click("[data-testid='tab-datasets-models']")
        time.sleep(0.5)
        sb.step(
            "Transformer Model Registry & Architecture Cards",
            "Inspected domain-adapted transformers: Legal-BERT, RoBERTa-Legal, and LegalSight Multi-Head Ensemble.",
            wait_time=0.6
        )

        # Step 3: Switch to Live Evaluator Playground
        sb.click("[data-testid='tab-datasets-playground']")
        sb.wait_visible("[data-testid='btn-run-eval']")
        sb.step(
            "Interactive Neural Inference Playground",
            "Loaded live evaluation console to test zero-shot clause classification and ContractNLI hypothesis entailment.",
            wait_time=0.5
        )

        # Step 4: Execute Neural Inference Run
        sb.click("[data-testid='btn-run-eval']")
        time.sleep(1.2)

        output_panel = sb.wait_visible("[data-testid='eval-output-panel']")
        sb.assert_step(
            output_panel.is_displayed(),
            "Neural Inference & ContractNLI Verification Complete",
            "Evaluated provision text; generated risk confidence score, token classification, and hypothesis breakdown.",
            "Evaluation output was not rendered."
        )
        return sb.case

def test_datasets_models():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
