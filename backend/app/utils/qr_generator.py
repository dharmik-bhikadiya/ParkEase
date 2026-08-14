import hmac
import hashlib
import json
from app.core.config import settings

def generate_qr_payload(data: dict) -> str:
    serialized = json.dumps(data, sort_keys=True)
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        serialized.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return json.dumps({"payload": data, "signature": signature})

def verify_qr_payload(payload_str: str) -> bool:
    try:
        parsed = json.loads(payload_str)
        data = parsed["payload"]
        signature = parsed["signature"]
        
        serialized = json.dumps(data, sort_keys=True)
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            serialized.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_sig)
    except Exception:
        return False
