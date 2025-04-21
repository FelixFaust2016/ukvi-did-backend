import forge from "node-forge";

export function encryptWithPublicKey(plaintext: string, publicKeyPem: string) {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

  // Step 1: Generate AES key and IV
  const aesKey = forge.random.getBytesSync(32); // 256-bit AES key
  const iv = forge.random.getBytesSync(12); // 96-bit IV for AES-GCM

  // Step 2: Encrypt plaintext using AES
  const cipher = forge.cipher.createCipher("AES-GCM", aesKey);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(plaintext, "utf8"));
  cipher.finish();
  const encryptedData = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes(); // authentication tag

  // Step 3: Encrypt AES key with RSA
  const encryptedKey = publicKey.encrypt(aesKey, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });

  return {
    encryptedKey: forge.util.encode64(encryptedKey),
    iv: forge.util.encode64(iv),
    ciphertext: forge.util.encode64(encryptedData),
    tag: forge.util.encode64(tag),
  };
}
