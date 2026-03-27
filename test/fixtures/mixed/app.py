from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import hashlib

# RSA - QUANTUM VULNERABLE
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# AES-256 - QUANTUM SAFE
aes_key = AESGCM.generate_key(bit_length=256)

# SHA-256 - QUANTUM SAFE
h = hashlib.sha256(b"data").hexdigest()
