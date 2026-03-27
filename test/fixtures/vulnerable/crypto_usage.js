const crypto = require('crypto');
const forge = require('node-forge');

// RSA key generation - QUANTUM VULNERABLE
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// DES encryption - WEAK
const cipher = crypto.createCipheriv('des', key, iv);

// MD5 hashing - WEAK
const hash = crypto.createHash('md5');
