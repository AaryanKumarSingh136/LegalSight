import re
import uuid
from typing import List, Dict, Any, Tuple
from app.models.schemas import (
    EntityExtraction, ClauseBlock, ClauseCategory, RiskLevel, RedlineSuggestion
)

class NLPEngine:
    """
    ContractAnalysisEngine performing Named Entity Recognition (NER),
    Clause Segmentation & Extraction, and Redline Mitigation Generation.
    """

    ENTITY_PATTERNS = {
        "PARTY": [
            r'(?:by and between|entered into by and between|between\s*:?)\s+([A-Z][A-Za-z0-9\.,\s&]+?)(?:\s*,?\s*(?:a|an|\(|having|with|\"Vendor\"|\"Customer\"|\"Buyer\"|\"Sellers\"|\"Client\"|\"Provider\"))',
            r'(?:and\s+)([A-Z][A-Za-z0-9\.,\s&]+?)(?:\s*,?\s*(?:a|an|\(|having|with|\"Vendor\"|\"Customer\"|\"Buyer\"|\"Sellers\"|\"Client\"|\"Provider\"))',
            r'\(\d+\)\s+([A-Z][A-Za-z0-9\s,\.&]+?(?:PLC|LLC|Inc\.|Corp\.|Corporation|Ltd\.|S\.A\.))',
            r'([A-Z][A-Za-z0-9\s]+(?:Inc\.|LLC|Corp\.|Corporation|PLC|Ltd\.|S\.A\.))'
        ],
        "EFFECTIVE_DATE": [
            r'(?:as of|dated as of|Dated as of|executed on|effective date:?)\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Z][a-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})',
            r'Effective Date:\s*([A-Za-z0-9\s,]+)'
        ],
        "GOVERNING_LAW": [
            r'(?:governed by|in accordance with the laws of|governing law shall be|governed by and construed in accordance with)\s+(?:the\s+)?(?:laws of\s+)?(the State of [A-Z][a-z]+|[A-Z][a-z]+,?\s+USA|English Law|laws of England and Wales|State of [A-Z][a-z]+|laws of [A-Z][a-z]+|[A-Z][a-z]+ Law|[A-Z][a-z]+)',
            r'Court of Chancery of\s+([A-Z][a-z]+)',
            r'High Court of Justice in\s+([A-Z][a-z]+)'
        ],
        "MONETARY_VALUE": [
            r'(\$\s?[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|million|thousand|billion|per annum|per violation|annum)?)',
            r'([\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|USD per month))'
        ],
        "DISPUTE_VENUE": [
            r'(?:settled exclusively by|administered by|arbitration administered by)\s+([A-Za-z\s,\(\)]+?(?:Association|Rules|Tribunal|Court))',
            r'(?:jurisdiction of the)\s+([A-Za-z\s]+Court[A-Za-z\s]*)',
            r'(?:High Court of Justice[A-Za-z\s\(\)]*)'
        ]
    }

    CLAUSE_SIGNATURES = [
        {
            "category": ClauseCategory.INDEMNITY,
            "patterns": [r"indemnif", r"hold harmless", r"defend", r"losses suffered resulting from", r"third-party claims"],
            "title_default": "Indemnification & Third-Party Claims"
        },
        {
            "category": ClauseCategory.LIMITATION_OF_LIABILITY,
            "patterns": [r"limitation of liability", r"aggregate liability", r"consequential damages", r"punitive damages", r"liability cap", r"sole and exclusive remedy"],
            "title_default": "Limitation of Liability & Consequential Damages"
        },
        {
            "category": ClauseCategory.TERMINATION,
            "patterns": [r"termination", r"term,", r"cure such breach", r"terminate for convenience", r"initial term", r"term of confidentiality"],
            "title_default": "Term, Termination & Suspension"
        },
        {
            "category": ClauseCategory.CONFIDENTIALITY,
            "patterns": [r"confidential information", r"trade secrets", r"non-disclosure", r"receiving party", r"disclosing party"],
            "title_default": "Confidentiality & Trade Secrets"
        },
        {
            "category": ClauseCategory.NON_COMPETE,
            "patterns": [r"non-compete", r"non-solicitation", r"restrictive covenants", r"not directly or indirectly solicit", r"competing directly", r"non-circumvention"],
            "title_default": "Non-Compete & Restrictive Covenants"
        },
        {
            "category": ClauseCategory.INTELLECTUAL_PROPERTY,
            "patterns": [r"intellectual property", r"customer data", r"retains exclusive ownership", r"patent", r"copyright", r"trademark", r"license during the term"],
            "title_default": "Intellectual Property & Proprietary Rights"
        },
        {
            "category": ClauseCategory.DATA_PRIVACY,
            "patterns": [r"gdpr", r"data privacy", r"security incident", r"data breach", r"iso 27001", r"soc 2", r"personal data"],
            "title_default": "Data Privacy, Cybersecurity & Compliance"
        },
        {
            "category": ClauseCategory.GOVERNING_LAW,
            "patterns": [r"governing law", r"jurisdiction", r"dispute resolution", r"arbitration", r"court of", r"court of chancery"],
            "title_default": "Governing Law, Jurisdiction & Dispute Resolution"
        },
        {
            "category": ClauseCategory.PAYMENT_TERMS,
            "patterns": [r"fees,", r"invoicing", r"payment terms", r"purchase price", r"past-due payments", r"escrow holdback", r"billing amount", r"purchase and sale"],
            "title_default": "Fees, Invoicing & Commercial Terms"
        }
    ]

    @classmethod
    def extract_entities(cls, text: str) -> List[EntityExtraction]:
        extractions: List[EntityExtraction] = []
        seen_texts = set()

        for category, regex_list in cls.ENTITY_PATTERNS.items():
            for pattern in regex_list:
                for match in re.finditer(pattern, text, re.IGNORECASE):
                    matched_str = match.group(1) if match.groups() else match.group(0)
                    cleaned_val = matched_str.strip(" ,;:\n\"'")
                    if len(cleaned_val) > 2 and cleaned_val.lower() not in seen_texts:
                        # Avoid generic filler words
                        if cleaned_val.lower() in ["the", "and", "or", "an", "agreement", "party", "parties", "this agreement"]:
                            continue
                        seen_texts.add(cleaned_val.lower())
                        extractions.append(EntityExtraction(
                            category=category,
                            text=cleaned_val,
                            confidence=0.95,
                            start_char=match.start(),
                            end_char=match.end()
                        ))
        return extractions

    @classmethod
    def segment_clauses(cls, text: str) -> List[ClauseBlock]:
        """
        Segments raw contract text into numbered or titled clause blocks.
        """
        section_pattern = r'(?:\n\s*(?:SECTION\s+\d+|\d+\.|\b[A-Z\s]{4,}\b:?)\s+[^\n]+)'
        matches = list(re.finditer(section_pattern, text))
        clauses: List[ClauseBlock] = []

        if len(matches) < 2:
            raw_paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
            current_pos = 0
            for i, p in enumerate(raw_paragraphs):
                start = text.find(p, current_pos)
                end = start + len(p) if start != -1 else current_pos + len(p)
                current_pos = end
                category, title = cls._classify_clause_text(p)
                clauses.append(ClauseBlock(
                    id=f"clause_{i+1}_{uuid.uuid4().hex[:6]}",
                    title=f"Section {i+1}: {title}",
                    category=category,
                    text=p,
                    start_idx=max(0, start),
                    end_idx=end,
                    risk_level=RiskLevel.LOW,
                    risk_score=15
                ))
            return clauses

        for i in range(len(matches)):
            start_idx = matches[i].start()
            end_idx = matches[i+1].start() if i + 1 < len(matches) else len(text)
            clause_content = text[start_idx:end_idx].strip()
            
            lines = clause_content.split("\n")
            header_line = lines[0].strip() if lines else f"Section {i+1}"
            header_line = re.sub(r'^[0-9\.\s\-:]+', '', header_line).strip()
            if not header_line or len(header_line) < 3:
                header_line = f"Section {i+1}"
                
            category, classified_title = cls._classify_clause_text(clause_content)
            title = header_line if 4 < len(header_line) < 70 else classified_title

            clauses.append(ClauseBlock(
                id=f"clause_{i+1}_{uuid.uuid4().hex[:6]}",
                title=f"Clause {i+1}: {title}",
                category=category,
                text=clause_content,
                start_idx=start_idx,
                end_idx=end_idx,
                risk_level=RiskLevel.LOW,
                risk_score=20
            ))

        return clauses

    @classmethod
    def _classify_clause_text(cls, text: str) -> Tuple[ClauseCategory, str]:
        text_lower = text.lower()
        for sig in cls.CLAUSE_SIGNATURES:
            for pat in sig["patterns"]:
                if re.search(pat, text_lower):
                    return sig["category"], sig["title_default"]
        return ClauseCategory.OTHER, "General Provisions"

    @classmethod
    def generate_redline_suggestion(cls, clause: ClauseBlock) -> Tuple[List[str], RedlineSuggestion]:
        text = clause.text
        red_flags = []
        replacement = text
        rationale = "Harmonized clause with market standard protections."

        if "without financial cap" in text.lower() or "unlimited" in text.lower():
            red_flags.append("Uncapped indemnification / Unlimited liability exposure")
            replacement = re.sub(
                r'without financial cap', 
                'subject to the aggregate liability cap set forth in Section 6', 
                replacement, 
                flags=re.IGNORECASE
            )
            replacement = re.sub(
                r'CUSTOMER\'S LIABILITY UNDER SECTION 5.2 \(INDEMNIFICATION\) AND BREACHES OF SECTION 4 \(CONFIDENTIALITY\) SHALL BE UNLIMITED\.', 
                'Each party\'s aggregate liability under Section 5 and Section 4 shall not exceed two times (2x) the total fees paid in the preceding 12 months.', 
                replacement, 
                flags=re.IGNORECASE
            )
            rationale = "Strike uncapped liability. Imposed a balanced mutual 2x annual contract value cap on super-cap categories."

        if "sole and exclusive remedy" in text.lower() and "service credit" in text.lower():
            red_flags.append("Exclusive remedy limits legal recovery for persistent SLA failures")
            replacement = re.sub(
                r"Customer's sole and exclusive remedy shall be service credits not to exceed 10% of the monthly billing amount\.",
                "Customer shall receive service credits, and if SLA availability falls below 99.0% in any two consecutive months, Customer may terminate without penalty and receive a pro-rata refund.",
                replacement,
                flags=re.IGNORECASE
            )
            rationale = "Added right to terminate for recurring chronic SLA non-performance with full pro-rata refund."

        if "customer does not possess the right to terminate for convenience" in text.lower():
            red_flags.append("Unilateral termination right favoring vendor without customer parity")
            replacement = re.sub(
                r"Customer does not possess the right to terminate for convenience\.",
                "Either party may terminate this Agreement for convenience upon ninety (90) days' prior written notice.",
                replacement,
                flags=re.IGNORECASE
            )
            rationale = "Established mutual convenience termination parity with standard 90-day transition window."

        if "twenty-four (24) months" in text.lower() or "thirty-six (36) months" in text.lower():
            if "non-compete" in text.lower() or "solicit" in text.lower():
                red_flags.append("Excessive restrictive covenant duration (over 12 months) and broad geographic scope")
                replacement = re.sub(
                    r'(twenty-four \(24\)|thirty-six \(36\)) months',
                    'twelve (12) months',
                    replacement,
                    flags=re.IGNORECASE
                )
                replacement = re.sub(
                    r'within North America|within Europe, North America, or Asia-Pacific',
                    'within the specific metropolitan territory of active direct client engagement',
                    replacement,
                    flags=re.IGNORECASE
                )
                rationale = "Reduced restrictive covenant duration to 12 months and narrowed geographic restriction to active markets to prevent antitrust enforceability issues."

        if "perpetuity" in text.lower() and "trade secrets" not in text.lower():
            red_flags.append("Indefinite confidentiality duration for standard commercial information")
            replacement = re.sub(r'in perpetuity', 'for a period of five (5) years', replacement, flags=re.IGNORECASE)
            rationale = "Bound general confidentiality duration to 5 years while keeping statutory trade secrets protected."

        if not red_flags:
            red_flags.append("Standard market terminology with moderate scrutiny needed")
            rationale = "Clause complies with baseline commercial standards. Standard review recommended."

        redline = RedlineSuggestion(
            original_text=clause.text,
            suggested_replacement=replacement,
            rationale=rationale,
            action_type="REPLACE" if replacement != text else "NONE"
        )
        return red_flags, redline
