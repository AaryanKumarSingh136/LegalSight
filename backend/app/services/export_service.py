import io
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.schemas import ContractMetadata, RiskScoreSummary, ClauseBlock, EntityExtraction

class ExportService:
    """
    Generates downloadable PDF Executive Summary Reports
    and comprehensive Markdown audit reports.
    """

    @classmethod
    def generate_pdf_report(
        cls,
        contract: ContractMetadata,
        risk_summary: RiskScoreSummary,
        clauses: List[ClauseBlock],
        entities: List[EntityExtraction]
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        # Custom styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#0F172A'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#475569')
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#1E293B'),
            fontName='Helvetica-Bold',
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )
        alert_style = ParagraphStyle(
            'AlertText',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#991B1B')
        )

        elements = []

        # Header Title
        elements.append(Paragraph("LegalSight AI &mdash; Contract Intelligence Report", title_style))
        elements.append(Paragraph(f"Analysis Profile: <b>{contract.risk_profile.value if hasattr(contract.risk_profile, 'value') else contract.risk_profile}</b> | Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceBefore=8, spaceAfter=14))

        # Executive Summary Box Table
        summary_data = [
            [
                Paragraph("<b>Document File:</b>", body_style),
                Paragraph(contract.filename, body_style),
                Paragraph("<b>Overall Risk Score:</b>", body_style),
                Paragraph(f"<b>{risk_summary.overall_score}/100 ({risk_summary.overall_level.value})</b>", body_style)
            ],
            [
                Paragraph("<b>Total Word Count:</b>", body_style),
                Paragraph(f"{contract.total_words:,} words", body_style),
                Paragraph("<b>Critical / High Risks:</b>", body_style),
                Paragraph(f"{risk_summary.flagged_clauses_count.get('CRITICAL', 0)} Critical, {risk_summary.flagged_clauses_count.get('HIGH', 0)} High", body_style)
            ]
        ]
        t_summary = Table(summary_data, colWidths=[110, 160, 120, 150])
        t_summary.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_summary)
        elements.append(Spacer(1, 10))

        # Executive Overview Paragraph
        elements.append(Paragraph("<b>Executive Assessment:</b>", h2_style))
        elements.append(Paragraph(risk_summary.executive_summary, body_style))
        elements.append(Spacer(1, 10))

        # Key Named Entities
        elements.append(Paragraph("<b>Extracted Legal Entities:</b>", h2_style))
        ent_rows = [["Entity Category", "Detected Value", "Confidence"]]
        for ent in entities[:6]:
            ent_rows.append([ent.category, ent.text[:50], f"{int(ent.confidence * 100)}%"])
        
        t_entities = Table(ent_rows, colWidths=[140, 310, 90])
        t_entities.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ]))
        elements.append(t_entities)
        elements.append(Spacer(1, 12))

        # High Risk Clauses & Mitigations
        elements.append(Paragraph("<b>Flagged High-Risk Clauses & Mitigation Redlines:</b>", h2_style))
        high_risk_clauses = [c for c in clauses if c.risk_level.value in ["CRITICAL", "HIGH"]]
        
        if not high_risk_clauses:
            elements.append(Paragraph("No critical or high-risk clauses were flagged in this document.", body_style))
        else:
            for clause in high_risk_clauses:
                clause_header = f"<b>{clause.title}</b> &mdash; <font color='#DC2626'><b>[{clause.risk_level.value} - Score {clause.risk_score}/100]</b></font>"
                elements.append(Paragraph(clause_header, body_style))
                elements.append(Spacer(1, 3))
                
                # Flagged issues
                if clause.red_flag_phrases:
                    flags_str = ", ".join(clause.red_flag_phrases)
                    elements.append(Paragraph(f"<b>Red Flags:</b> {flags_str}", alert_style))
                    elements.append(Spacer(1, 2))
                
                # Mitigation Recommendation
                if clause.mitigation_recommendation:
                    elements.append(Paragraph(f"<b>Mitigation:</b> {clause.mitigation_recommendation}", body_style))
                    elements.append(Spacer(1, 3))

                # Suggested Redline
                if clause.redline and clause.redline.suggested_replacement != clause.text:
                    elements.append(Paragraph(f"<b>Proposed Revision:</b> <i>\"{clause.redline.suggested_replacement[:200]}...\"</i>", body_style))
                
                elements.append(Spacer(1, 8))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
