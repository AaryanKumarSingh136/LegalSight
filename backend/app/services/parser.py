import re
import io
import logging
from typing import Tuple, Dict, Any, List
from pypdf import PdfReader
import docx

logger = logging.getLogger("DocumentParser")

class DocumentParser:
    """
    Ingestion Gateway Document Parser supporting PDF, DOCX, and TXT formats
    with OCR cleanup, metadata extraction, and sentence/paragraph indexing.
    """

    @staticmethod
    def clean_text(raw_text: str) -> str:
        """
        Normalize and clean extracted/OCR text:
        1. Standardize line breaks (\r\n -> \n)
        2. Reconnect words split across line breaks by OCR scanners (e.g., in-\n demnify -> indemnify)
        3. Collapse excessive whitespace and preserve paragraph boundaries
        """
        text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
        lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split("\n")]
        cleaned = "\n".join(lines)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned.strip()

    @classmethod
    def _ocr_page_images_fallback(cls, page) -> str:
        """
        Fallback OCR for scanned image-only PDF pages using pytesseract if available.
        """
        try:
            import pytesseract
            from PIL import Image

            page_text_parts = []
            for img_obj in getattr(page, 'images', []):
                try:
                    img_bytes = img_obj.data
                    img = Image.open(io.BytesIO(img_bytes))
                    extracted = pytesseract.image_to_string(img)
                    if extracted.strip():
                        page_text_parts.append(extracted.strip())
                except Exception as img_err:
                    logger.debug(f"Image OCR failed: {img_err}")
            return "\n".join(page_text_parts)
        except ImportError:
            # pytesseract or PIL not installed, gracefully continue
            return ""
        except Exception as e:
            logger.debug(f"OCR fallback error: {e}")
            return ""

    @classmethod
    def parse_pdf(cls, file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        stream = io.BytesIO(file_bytes)
        reader = PdfReader(stream)
        page_count = len(reader.pages)
        raw_text_parts = []
        ocr_fallback_triggered = False

        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            # If page text is empty or very short (< 20 chars), attempt OCR fallback on page images
            if len(page_text.strip()) < 20:
                fallback_text = cls._ocr_page_images_fallback(page)
                if fallback_text:
                    page_text = fallback_text
                    ocr_fallback_triggered = True
            raw_text_parts.append(page_text)
        
        raw_text = "\n\n".join(raw_text_parts)
        cleaned_text = cls.clean_text(raw_text)
        words = len(cleaned_text.split())
        metadata = {
            "page_count": page_count,
            "total_words": words,
            "char_count": len(cleaned_text),
            "parser": "PyPDF + Tesseract-OCR-Fallback" if ocr_fallback_triggered else "PyPDF-Digital-Parser"
        }
        return cleaned_text, metadata

    @classmethod
    def parse_docx(cls, file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        stream = io.BytesIO(file_bytes)
        doc = docx.Document(stream)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        
        # Also extract table text if present
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    paragraphs.append(row_text)
                    
        raw_text = "\n\n".join(paragraphs)
        cleaned_text = cls.clean_text(raw_text)
        words = len(cleaned_text.split())
        est_pages = max(1, (words + 399) // 400)
        metadata = {
            "page_count": est_pages,
            "total_words": words,
            "char_count": len(cleaned_text),
            "parser": "Python-Docx-Engine"
        }
        return cleaned_text, metadata

    @classmethod
    def parse_txt(cls, file_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        try:
            raw_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raw_text = file_bytes.decode("latin-1", errors="ignore")
            
        cleaned_text = cls.clean_text(raw_text)
        words = len(cleaned_text.split())
        est_pages = max(1, (words + 399) // 400)
        metadata = {
            "page_count": est_pages,
            "total_words": words,
            "char_count": len(cleaned_text),
            "parser": "PlainText-Parser"
        }
        return cleaned_text, metadata

    @classmethod
    def parse_bytes(cls, file_bytes: bytes, filename: str) -> Tuple[str, Dict[str, Any]]:
        ext = filename.lower().split(".")[-1]
        if ext == "pdf":
            return cls.parse_pdf(file_bytes)
        elif ext in ["docx", "doc"]:
            return cls.parse_docx(file_bytes)
        elif ext in ["txt", "md"]:
            return cls.parse_txt(file_bytes)
        else:
            return cls.parse_txt(file_bytes)
