"""
LegalSight Database Setup & Seed Utility
Initializes relational tables, seeds platform users, and populates the sample contract corpus.
"""

import sys
import os
import asyncio

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine, Base, SessionLocal
from app.db.models import User, Contract, LegalClause, AuditLog
from app.services.auth_service import AuthService
from app.services.orchestrator import orchestrator
from app.sample_contracts.contracts import SAMPLE_CONTRACTS
from app.models.schemas import RiskProfileType

async def setup_and_seed_database():
    print("=" * 60)
    print("  LegalSight — Database Setup & Seeding Engine")
    print("=" * 60)

    # 1. Create all database tables
    print("\n[1/3] Creating relational database tables...")
    Base.metadata.create_all(bind=engine)
    print("  -> Tables confirmed: users, contracts, legal_clauses, audit_logs")

    # 2. Seed Default User Accounts
    print("\n[2/3] Verifying and seeding default demo user accounts...")
    db = SessionLocal()
    try:
        AuthService.seed_demo_users(db)
        user_count = db.query(User).count()
        print(f"  -> Total users registered: {user_count}")
        for u in db.query(User).all():
            print(f"     * {u.username} ({u.email}) — Role: {u.role}")
    finally:
        db.close()

    # 3. Seed Sample Contracts Corpus
    print("\n[3/3] Ingesting and analyzing realistic contract corpus into database...")
    profiles = {
        "sample_msa": RiskProfileType.VENDOR_STANDARD,
        "sample_spa": RiskProfileType.MA_AGGRESSIVE,
        "sample_nda": RiskProfileType.BALANCED_COMMERCIAL,
        "sample_ip_license": RiskProfileType.BALANCED_COMMERCIAL,
        "sample_dpa": RiskProfileType.STRICT_COMPLIANCE,
    }

    db = SessionLocal()
    try:
        for key, sample in SAMPLE_CONTRACTS.items():
            existing = db.query(Contract).filter(Contract.filename == sample["filename"]).first()
            if not existing:
                profile = profiles.get(key, RiskProfileType.VENDOR_STANDARD)
                print(f"  -> Processing sample '{key}': {sample['title']} (Profile: {profile.value})...")
                job_id = await orchestrator.initialize_from_sample(key, profile)
                print(f"     Analyzed -> Job ID: {job_id}")
            else:
                print(f"  -> Already in database: '{sample['filename']}' ({existing.contract_id})")

        total_contracts = db.query(Contract).count()
        total_clauses = db.query(LegalClause).count()
        total_logs = db.query(AuditLog).count()
        print("\n" + "=" * 60)
        print("  Database Seeding Completed Successfully!")
        print(f"  - Active Contracts in DB: {total_contracts}")
        print(f"  - Classified Clauses:     {total_clauses}")
        print(f"  - Immutable Audit Events: {total_logs}")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(setup_and_seed_database())
