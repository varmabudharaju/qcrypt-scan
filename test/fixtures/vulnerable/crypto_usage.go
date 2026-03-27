package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/md5"
	"fmt"
)

func main() {
	// RSA - QUANTUM VULNERABLE
	key, _ := rsa.GenerateKey(rand.Reader, 2048)

	// ECDSA - QUANTUM VULNERABLE
	ecKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)

	// MD5 - WEAK
	h := md5.Sum([]byte("data"))

	fmt.Println(key, ecKey, h)
}
