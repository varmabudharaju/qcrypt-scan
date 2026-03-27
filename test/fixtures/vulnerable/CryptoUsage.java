import java.security.KeyPairGenerator;
import java.security.KeyPair;
import javax.crypto.Cipher;

public class CryptoUsage {
    public static void main(String[] args) throws Exception {
        // RSA - QUANTUM VULNERABLE
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();

        // DES - WEAK
        Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
    }
}
