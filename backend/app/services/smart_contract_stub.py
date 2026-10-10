import uuid
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

def utc_now():
    return datetime.now(timezone.utc)

class Milestone:
    def __init__(self, milestone_id: str, title: str, payout_amount: float, status: str = "PENDING"):
        self.milestone_id = milestone_id
        self.title = title
        self.payout_amount = payout_amount
        self.status = status
        self.completed_at = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "milestone_id": self.milestone_id,
            "title": self.title,
            "payout_amount": self.payout_amount,
            "status": self.status,
            "completed_at": self.completed_at
        }

class PaymentTrigger:
    def __init__(self, trigger_id: str, event_name: str, oracle_source: str, target_address: str):
        self.trigger_id = trigger_id
        self.event_name = event_name
        self.oracle_source = oracle_source
        self.target_address = target_address
        self.is_active = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trigger_id": self.trigger_id,
            "event_name": self.event_name,
            "oracle_source": self.oracle_source,
            "target_address": self.target_address,
            "is_active": self.is_active
        }

class ExecutionRule:
    def __init__(self, rule_id: str, clause_type: str, condition: str, action: str):
        self.rule_id = rule_id
        self.clause_type = clause_type
        self.condition = condition
        self.action = action

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "clause_type": self.clause_type,
            "condition": self.condition,
            "action": self.action
        }

class SmartContract:
    """
    Smart Contract Lifecycle Interface (MVP Stub).
    Encapsulates on-chain contract drafting, EVM compilation, and payment triggers.
    """

    def __init__(
        self,
        contract_id: str,
        name: str,
        network: str = "Ethereum Sepolia (Testnet)"
    ):
        self.contract_id = contract_id
        self.name = name
        self.network = network
        self.bytecode_hash: Optional[str] = None
        self.contract_address: Optional[str] = None
        self.deployed: bool = False
        self.deployed_at: Optional[str] = None
        self.solidity_code: Optional[str] = None
        self.execution_logs: List[Dict[str, Any]] = []
        self.rules: List[ExecutionRule] = []
        self.triggers: List[PaymentTrigger] = []
        self.milestones: List[Milestone] = []

    def generate_solidity(self) -> str:
        """
        Generate EVM-compliant Solidity 0.8.24 source code corresponding to the drafted contract.
        """
        sanitized_name = re.sub(r'[^a-zA-Z0-9]', '', self.name) or "LegalAgreementEscrow"
        return f"""// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title {sanitized_name}
 * @notice Automated Legal Agreement Escrow & SLA Enforcement Contract
 * @dev Synthesized by LegalSight AI Contract Intelligence Engine
 * Agreement ID: {self.contract_id}
 */

interface IERC20 {{
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}}

contract {sanitized_name} {{
    address public immutable customer;
    address public immutable provider;
    address public oracleResolver;
    IERC20 public settlementToken;

    enum MilestoneState {{ PENDING, COMPLETED, DISPUTED }}
    
    struct Milestone {{
        string description;
        uint256 payoutAmount;
        MilestoneState state;
        uint256 completedTimestamp;
    }}

    Milestone[] public milestones;
    uint256 public totalEscrowCommitted;
    uint256 public constant MIN_UPTIME_BPS = 9995; // 99.95%

    event EscrowTrancheReleased(uint256 indexed milestoneId, uint256 amount, address indexed recipient);
    event SLABreachRefundExecuted(uint16 uptimeBps, uint256 penaltyAmount, address indexed customer);
    event OracleTelemetryUpdated(string indexed telemetrySource, uint256 timestamp);

    modifier onlyOracle() {{
        require(msg.sender == oracleResolver, "Caller is not authorized oracle");
        _;
    }}

    modifier onlyParties() {{
        require(msg.sender == customer || msg.sender == provider, "Unauthorized party");
        _;
    }}

    constructor(
        address _customer,
        address _provider,
        address _oracleResolver,
        address _tokenAddress
    ) {{
        customer = _customer;
        provider = _provider;
        oracleResolver = _oracleResolver;
        settlementToken = IERC20(_tokenAddress);

        // Pre-configured agreement milestones
        milestones.push(Milestone("Platform Setup & Production Cutover", 250000 * 1e6, MilestoneState.COMPLETED, block.timestamp));
        milestones.push(Milestone("Year 1 Service Delivery & Security Audit", 500000 * 1e6, MilestoneState.PENDING, 0));
        milestones.push(Milestone("Contract Renewal & Final SLA Settlement", 700000 * 1e6, MilestoneState.PENDING, 0));
        totalEscrowCommitted = 1450000 * 1e6;
    }}

    function releaseEscrowTranche(uint256 _milestoneId) external onlyOracle {{
        require(_milestoneId < milestones.length, "Invalid milestone");
        Milestone storage m = milestones[_milestoneId];
        require(m.state == MilestoneState.PENDING, "Milestone not pending");

        m.state = MilestoneState.COMPLETED;
        m.completedTimestamp = block.timestamp;

        require(settlementToken.transfer(provider, m.payoutAmount), "Transfer failed");
        emit EscrowTrancheReleased(_milestoneId, m.payoutAmount, provider);
    }}

    function triggerSlaRefund(uint16 _uptimeBps) external onlyOracle {{
        require(_uptimeBps < MIN_UPTIME_BPS, "SLA requirement satisfied");
        
        // 10% penalty calculation under MSA Section 1.2
        uint256 monthlyBilling = totalEscrowCommitted / 12;
        uint256 penaltyAmount = (monthlyBilling * 10) / 100;

        require(settlementToken.transfer(customer, penaltyAmount), "Penalty transfer failed");
        emit SLABreachRefundExecuted(_uptimeBps, penaltyAmount, customer);
    }}

    function getMilestonesCount() external view returns (uint256) {{
        return milestones.length;
    }}
}}
"""

    def draftContract(self, clauses_metadata: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Synthesize legal clauses into automated execution rules, milestones, and Solidity code.
        """
        import re
        self.rules = [
            ExecutionRule(
                rule_id=f"rule_{uuid.uuid4().hex[:6]}",
                clause_type="Payment Terms",
                condition="Quarterly billing verification certified by SAP Oracle webhook",
                action="Release escrow tranche of $362,500 USDC"
            ),
            ExecutionRule(
                rule_id=f"rule_{uuid.uuid4().hex[:6]}",
                clause_type="SLA Compliance",
                condition="Monthly uptime telemetry < 99.95% (Chainlink Oracle Feed)",
                action="Execute automatic 10% penalty refund ($12,083 USDC) to Customer Wallet"
            ),
            ExecutionRule(
                rule_id=f"rule_{uuid.uuid4().hex[:6]}",
                clause_type="Escrow Holdback",
                condition="18-Month indemnity escrow period expires without unresolved warranty claim",
                action="Release remaining balance to Seller Account"
            )
        ]

        self.triggers = [
            PaymentTrigger(
                trigger_id=f"trig_sla_{uuid.uuid4().hex[:6]}",
                event_name="SLA_BREACH_PENALTY",
                oracle_source="Chainlink Cloudflare Telemetry Feed (Node 0x93F...)",
                target_address="0x71C...498f"
            ),
            PaymentTrigger(
                trigger_id=f"trig_escrow_{uuid.uuid4().hex[:6]}",
                event_name="ESCROW_RELEASE_M1",
                oracle_source="DocuSign Multi-Sig Milestone Sign-off Webhook",
                target_address="0x34A...92bc"
            )
        ]

        self.milestones = [
            Milestone(f"ms_{uuid.uuid4().hex[:6]}", "Platform Setup & Production Cutover", 250000.0, "COMPLETED"),
            Milestone(f"ms_{uuid.uuid4().hex[:6]}", "Year 1 Service Delivery & Security Audit", 500000.0, "PENDING"),
            Milestone(f"ms_{uuid.uuid4().hex[:6]}", "Contract Renewal & Final SLA Settlement", 700000.0, "PENDING")
        ]

        self.solidity_code = self.generate_solidity()

        return {
            "status": "DRAFTED",
            "contract_name": f"{self.name} (Solidity v0.8.24)",
            "rules_count": len(self.rules),
            "triggers_count": len(self.triggers),
            "milestones_count": len(self.milestones),
            "solidity_code": self.solidity_code,
            "abi_interface": [
                {"name": "releaseEscrowTranche", "type": "function", "inputs": [{"name": "trancheId", "type": "uint256"}]},
                {"name": "triggerSlaRefund", "type": "function", "inputs": [{"name": "uptimeBps", "type": "uint16"}]}
            ]
        }

    def deployToBlockchain(self, gas_limit: int = 2500000) -> Dict[str, Any]:
        """
        Simulate deploying the synthesized smart contract to blockchain.
        """
        self.deployed = True
        self.contract_address = f"0x{uuid.uuid4().hex[:40]}"
        self.bytecode_hash = f"0x{uuid.uuid4().hex}"
        self.deployed_at = utc_now().isoformat()
        if not self.solidity_code:
            self.solidity_code = self.generate_solidity()

        return {
            "status": "DEPLOYED",
            "network": self.network,
            "contract_address": self.contract_address,
            "transaction_hash": f"0x{uuid.uuid4().hex}",
            "block_number": 19482711,
            "gas_used": 1845200,
            "deployed_at": self.deployed_at,
            "explorer_url": f"https://sepolia.etherscan.io/address/{self.contract_address}"
        }

    def execute_trigger(self, trigger_id_or_name: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Simulate on-chain execution of an automated trigger or oracle webhook event.
        """
        payload = payload or {}
        tx_hash = f"0x{uuid.uuid4().hex}"
        event_name = trigger_id_or_name

        if "sla" in trigger_id_or_name.lower() or "SLA_BREACH" in trigger_id_or_name:
            event_name = "SLA_BREACH_PENALTY"
            action_desc = "Chainlink reported 99.82% uptime (< 99.95% threshold). Executed 10% penalty refund of $12,083 USDC to Customer."
        else:
            event_name = "ESCROW_RELEASE_M1"
            action_desc = "DocuSign Oracle confirmed Year 1 Audit completion. Released $500,000 USDC escrow tranche to Provider."
            for m in self.milestones:
                if m.status == "PENDING":
                    m.status = "COMPLETED"
                    m.completed_at = utc_now().isoformat()
                    break

        receipt = {
            "transaction_hash": tx_hash,
            "block_number": 19482715,
            "event_emitted": event_name,
            "gas_spent": 84210,
            "status": "CONFIRMED",
            "action_executed": action_desc,
            "executed_at": utc_now().isoformat(),
            "target_contract": self.contract_address or "0x892aF12...4e81",
            "network": self.network
        }
        self.execution_logs.append(receipt)
        return receipt

    def queryState(self) -> Dict[str, Any]:
        """Return current simulated smart contract state."""
        return {
            "contract_id": self.contract_id,
            "name": self.name,
            "network": self.network,
            "deployed": self.deployed,
            "contract_address": self.contract_address,
            "bytecode_hash": self.bytecode_hash,
            "deployed_at": self.deployed_at,
            "solidity_code": self.solidity_code or self.generate_solidity(),
            "rules": [r.to_dict() for r in self.rules],
            "triggers": [t.to_dict() for t in self.triggers],
            "milestones": [m.to_dict() for m in self.milestones],
            "execution_logs": self.execution_logs
        }

