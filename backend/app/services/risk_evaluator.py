from typing import List, Dict, Tuple
from app.models.schemas import (
    ClauseBlock, ClauseCategory, RiskLevel, RiskProfileType,
    RiskScoreSummary, RedlineSuggestion
)
from app.services.nlp_engine import NLPEngine

class RiskEvaluator:
    """
    Multi-profile Risk Scoring Engine.
    Evaluates individual clauses and aggregates document-wide scorecards (0-100).
    """

    # Weights by profile for each clause category
    PROFILE_WEIGHTS = {
        RiskProfileType.VENDOR_STANDARD: {
            ClauseCategory.LIMITATION_OF_LIABILITY: 1.4,
            ClauseCategory.INDEMNITY: 1.3,
            ClauseCategory.PAYMENT_TERMS: 1.2,
            ClauseCategory.TERMINATION: 1.1,
            ClauseCategory.INTELLECTUAL_PROPERTY: 1.0,
            ClauseCategory.NON_COMPETE: 0.9,
            ClauseCategory.DATA_PRIVACY: 1.0,
            ClauseCategory.CONFIDENTIALITY: 0.8,
            ClauseCategory.GOVERNING_LAW: 0.7,
            ClauseCategory.OTHER: 0.5,
        },
        RiskProfileType.MA_AGGRESSIVE: {
            ClauseCategory.INDEMNITY: 1.5,
            ClauseCategory.NON_COMPETE: 1.4,
            ClauseCategory.LIMITATION_OF_LIABILITY: 1.3,
            ClauseCategory.INTELLECTUAL_PROPERTY: 1.3,
            ClauseCategory.TERMINATION: 1.2,
            ClauseCategory.PAYMENT_TERMS: 1.1,
            ClauseCategory.GOVERNING_LAW: 1.0,
            ClauseCategory.DATA_PRIVACY: 1.0,
            ClauseCategory.CONFIDENTIALITY: 0.9,
            ClauseCategory.OTHER: 0.6,
        },
        RiskProfileType.STRICT_COMPLIANCE: {
            ClauseCategory.DATA_PRIVACY: 1.5,
            ClauseCategory.GOVERNING_LAW: 1.4,
            ClauseCategory.CONFIDENTIALITY: 1.3,
            ClauseCategory.LIMITATION_OF_LIABILITY: 1.3,
            ClauseCategory.INDEMNITY: 1.2,
            ClauseCategory.INTELLECTUAL_PROPERTY: 1.1,
            ClauseCategory.TERMINATION: 1.0,
            ClauseCategory.PAYMENT_TERMS: 0.8,
            ClauseCategory.NON_COMPETE: 0.8,
            ClauseCategory.OTHER: 0.5,
        },
        RiskProfileType.BALANCED_COMMERCIAL: {
            ClauseCategory.LIMITATION_OF_LIABILITY: 1.2,
            ClauseCategory.INDEMNITY: 1.2,
            ClauseCategory.TERMINATION: 1.1,
            ClauseCategory.INTELLECTUAL_PROPERTY: 1.1,
            ClauseCategory.DATA_PRIVACY: 1.1,
            ClauseCategory.PAYMENT_TERMS: 1.0,
            ClauseCategory.CONFIDENTIALITY: 1.0,
            ClauseCategory.NON_COMPETE: 1.0,
            ClauseCategory.GOVERNING_LAW: 0.9,
            ClauseCategory.OTHER: 0.6,
        }
    }

    @classmethod
    def evaluate_clause(cls, clause: ClauseBlock, profile: RiskProfileType) -> ClauseBlock:
        text_lower = clause.text.lower()
        base_score = 20
        red_flags, redline = NLPEngine.generate_redline_suggestion(clause)

        # Keyword risk triggers
        if "without financial cap" in text_lower or "shall be unlimited" in text_lower or "unlimited liability" in text_lower:
            base_score += 55
        if "sole and exclusive remedy" in text_lower and "service credit" in text_lower:
            base_score += 35
        if "customer does not possess the right to terminate for convenience" in text_lower:
            base_score += 45
        if "thirty-six (36) months" in text_lower or "twenty-four (24) months" in text_lower:
            if clause.category == ClauseCategory.NON_COMPETE:
                base_score += 40
        if "liquidated damages" in text_lower:
            base_score += 30
        if "indemnify and hold harmless" in text_lower and "all claims, liabilities, losses" in text_lower:
            base_score += 25
        if "perpetuity" in text_lower:
            base_score += 20

        # Adjust by Profile weight
        profile_weights = cls.PROFILE_WEIGHTS.get(profile, cls.PROFILE_WEIGHTS[RiskProfileType.VENDOR_STANDARD])
        weight = profile_weights.get(clause.category, 1.0)
        final_score = int(min(100, max(5, base_score * weight)))

        # Assign Risk Level
        if final_score >= 75:
            level = RiskLevel.CRITICAL
        elif final_score >= 50:
            level = RiskLevel.HIGH
        elif final_score >= 30:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        # Formulate mitigation recommendation text
        mitigation = None
        if level in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
            mitigation = f"[{level.value} RISK] {redline.rationale} Adopt the proposed redline to protect against asymmetric liability."
        elif level == RiskLevel.MEDIUM:
            mitigation = f"[{level.value} RISK] Verify commercial alignment on operational expectations before execution."
        else:
            mitigation = "Standard legal language with acceptable counterparty risk."

        clause.risk_level = level
        clause.risk_score = final_score
        clause.red_flag_phrases = red_flags
        clause.mitigation_recommendation = mitigation
        clause.redline = redline
        return clause

    @classmethod
    def compute_summary(cls, clauses: List[ClauseBlock], profile: RiskProfileType) -> RiskScoreSummary:
        if not clauses:
            return RiskScoreSummary(
                overall_score=0,
                overall_level=RiskLevel.LOW,
                category_scores={},
                flagged_clauses_count={"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
                executive_summary="No clauses parsed yet.",
                top_recommendations=["Upload a document to begin analysis."]
            )

        counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        category_totals: Dict[str, List[int]] = {}

        for c in clauses:
            counts[c.risk_level.value] = counts.get(c.risk_level.value, 0) + 1
            cat_name = c.category.value
            if cat_name not in category_totals:
                category_totals[cat_name] = []
            category_totals[cat_name].append(c.risk_score)

        # Average category scores
        cat_scores = {cat: int(sum(scores) / len(scores)) for cat, scores in category_totals.items()}

        # Weighted document overall score
        # Give higher weight to critical & high risk clauses
        max_clause_score = max(c.risk_score for c in clauses)
        avg_clause_score = sum(c.risk_score for c in clauses) / len(clauses)
        overall_score = int((max_clause_score * 0.55) + (avg_clause_score * 0.45))
        overall_score = min(100, max(0, overall_score))

        if overall_score >= 75:
            overall_level = RiskLevel.CRITICAL
        elif overall_score >= 50:
            overall_level = RiskLevel.HIGH
        elif overall_score >= 30:
            overall_level = RiskLevel.MEDIUM
        else:
            overall_level = RiskLevel.LOW

        top_recs = []
        for c in sorted(clauses, key=lambda x: x.risk_score, reverse=True):
            if c.mitigation_recommendation and c.risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH]:
                top_recs.append(f"{c.title}: {c.mitigation_recommendation}")
                if len(top_recs) >= 3:
                    break

        if not top_recs:
            top_recs = ["Contract clauses conform closely to standard commercial baselines."]

        summary_text = (
            f"Under the '{profile.value}' risk profile, the agreement receives an overall risk score of {overall_score}/100 ({overall_level.value}). "
            f"Analysis detected {counts['CRITICAL']} Critical, {counts['HIGH']} High, and {counts['MEDIUM']} Medium risk exposure areas. "
            f"Primary risk concentrations reside in Limitation of Liability, Indemnification covenants, and Restrictive Terms."
        )

        return RiskScoreSummary(
            overall_score=overall_score,
            overall_level=overall_level,
            category_scores=cat_scores,
            flagged_clauses_count=counts,
            executive_summary=summary_text,
            top_recommendations=top_recs
        )
