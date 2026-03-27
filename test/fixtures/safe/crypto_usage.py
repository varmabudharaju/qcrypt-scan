from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib

# AES-256-GCM - QUANTUM SAFE
key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)

# SHA-256 - QUANTUM SAFE
digest = hashlib.sha256(b"data").hexdigest()

# SHA-3 - QUANTUM SAFE
sha3_hash = hashlib.sha3_256(b"data").hexdigest()
