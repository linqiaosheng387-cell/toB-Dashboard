"""Password hashing using the PBKDF2-HMAC-SHA256 algorithm (stdlib only)."""
import hashlib
import hmac
import os

from .config import get_settings


def hash_password(password: str) -> str:
    iterations = get_settings().pbkdf2_iterations
    salt = os.urandom(16).hex()
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt), iterations
    ).hex()
    return f"pbkdf2_sha256${iterations}${salt}${derived}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        derived = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt), int(iterations)
        ).hex()
        return hmac.compare_digest(derived, expected)
    except (ValueError, TypeError):
        return False
