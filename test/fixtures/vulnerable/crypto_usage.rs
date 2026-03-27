use rsa::{RsaPrivateKey, RsaPublicKey};
use rand::rngs::OsRng;

fn main() {
    // RSA - QUANTUM VULNERABLE
    let private_key = RsaPrivateKey::new(&mut OsRng, 2048).unwrap();
    let public_key = RsaPublicKey::from(&private_key);
    println!("{:?}", public_key);
}
