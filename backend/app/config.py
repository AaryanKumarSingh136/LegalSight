import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SAMPLES_DIR = BASE_DIR / "app" / "sample_contracts"
STORAGE_DIR = BASE_DIR / "storage"

# Create directories if they do not exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

APP_TITLE = "LegalSight AI"
APP_DESCRIPTION = "NLP-Driven Legal Intelligence & Contract Analytics System"
APP_VERSION = "1.0.0"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]
