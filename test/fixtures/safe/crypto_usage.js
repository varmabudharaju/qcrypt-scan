const crypto = require('crypto');

// AES-256-GCM - QUANTUM SAFE
const key = crypto.randomBytes(32);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

// SHA-256 - QUANTUM SAFE
const hash = crypto.createHash('sha256');
