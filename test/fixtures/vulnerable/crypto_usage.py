from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.primitives import hashes
import hashlib

# RSA key generation - QUANTUM VULNERABLE
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

# ECDSA key generation - QUANTUM VULNERABLE
ec_key = ec.generate_private_key(ec.SECP256R1())

# MD5 hashing - WEAK
digest = hashlib.md5(b"sensitive data").hexdigest()

# SHA-1 hashing - WEAK
sha1_hash = hashlib.sha1(b"data").hexdigest()
