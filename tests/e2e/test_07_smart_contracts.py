"""
LegalSight Storyboarder Test 07: Smart Contract Studio & EVM Synthesis
Tests automatic translation of legal clauses into Solidity 0.8.24 contracts and oracle triggers.
"""
import sys
import time
from pathlib import Path

# Add tests directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from storyboarder import Storyboarder

def run_test(headless=True, browser="chrome"):
    with Storyboarder(
        test_id="test_07_smart_contracts",
        name="Smart Contract Studio & EVM Solidity 0.8.24 Synthesis",
        headless=headless,
        browser=browser
    ) as sb:
        # Step 1: Open Smart Contract Studio
        sb.open_app()
        sb.wait_visible("[data-testid='nav-smart_contracts']")
        sb.click("[data-testid='nav-smart_contracts']")
        sb.wait_visible("[data-testid='btn-synthesize-rules']")
        sb.step(
            "Legal-to-Code Smart Contract Studio",
            "Loaded studio for translating natural language legal covenants into executable EVM state machines.",
            wait_time=0.7
        )

        # Step 2: Synthesize Execution Rules & Solidity
        sb.click("[data-testid='btn-synthesize-rules']")
        time.sleep(1.2)
        sb.step(
            "Synthesized EVM State Transition Rules",
            "Extracted milestone payment conditions, SLA uptime penalties, and escrow release gates into formal logic.",
            wait_time=0.6
        )

        # Step 3: Inspect Solidity 0.8.24 Code Tab
        sb.click("[data-testid='tab-sc-solidity']")
        time.sleep(0.5)
        sb.step(
            "Compiled Solidity 0.8.24 Smart Contract",
            "Viewed production-ready OpenZeppelin-compatible Solidity contract with ReentrancyGuard and Ownable hooks.",
            wait_time=0.6
        )

        # Step 4: Inspect Oracle Trigger Simulator Tab
        sb.click("[data-testid='tab-sc-triggers']")
        time.sleep(0.5)
        sb.step(
            "Automated Oracle Trigger Mapping",
            "Inspected webhook and Chainlink oracle endpoints mapped to SLA breaches, delivery milestones, and audit milestones.",
            wait_time=0.5
        )

        # Step 5: Simulate Sepolia Deployment
        deploy_btn = sb.find("[data-testid='btn-simulate-deploy']")
        sb.click(deploy_btn)
        time.sleep(1.0)
        sb.step(
            "Simulated EVM Sandbox Deployment",
            "Simulated deployment to testnet sandbox with gas estimation, constructor parameters, and verified bytecode.",
            wait_time=0.6
        )
        return sb.case

def test_smart_contracts():
    """Pytest entrypoint."""
    run_test(headless=True)

if __name__ == "__main__":
    headless_mode = "--headed" not in sys.argv
    browser_type = "edge" if "--edge" in sys.argv else "chrome"
    run_test(headless=headless_mode, browser=browser_type)
