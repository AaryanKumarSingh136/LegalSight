import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from sqlalchemy.orm import Session
from app.db.models import User, AuditLog

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "legalsight-super-secret-jwt-key-2026-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using PBKDF2-HMAC-SHA256 with a unique random salt."""
        salt = secrets.token_hex(16)
        pwd_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations=100000
        ).hex()
        return f"{salt}${pwd_hash}"

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against stored salt and hash."""
        try:
            if "$" not in hashed_password:
                return False
            salt, stored_hash = hashed_password.split("$", 1)
            calculated_hash = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations=100000
            ).hex()
            return secrets.compare_digest(stored_hash, calculated_hash)
        except Exception:
            return False

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        now = datetime.now(timezone.utc)
        if expires_delta:
            expire = now + expires_delta
        else:
            expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": int(expire.timestamp()), "iat": int(now.timestamp())})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None

    @staticmethod
    def seed_demo_users(db: Session):
        """Seed default Analyst and Admin accounts if they don't exist."""
        demo_users = [
            {
                "username": "analyst",
                "email": "analyst@legalsight.ai",
                "password": "password123",
                "role": "Analyst"
            },
            {
                "username": "admin",
                "email": "admin@legalsight.ai",
                "password": "password123",
                "role": "Admin"
            }
        ]
        for u in demo_users:
            existing = db.query(User).filter((User.email == u["email"]) | (User.username == u["username"])).first()
            if not existing:
                new_user = User(
                    username=u["username"],
                    email=u["email"],
                    password_hash=AuthService.hash_password(u["password"]),
                    role=u["role"]
                )
                db.add(new_user)
        try:
            db.commit()
        except Exception:
            db.rollback()

auth_service = AuthService()
