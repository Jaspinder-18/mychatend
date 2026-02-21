/**
 * END-TO-END ENCRYPTION SERVICE
 * Uses Web Crypto API (SubtleCrypto)
 * Standard: RSA-OAEP for key exchange, AES-GCM for message data.
 */

export const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
        privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
    };
};

export const encryptMessage = async (text, recipientPublicKeyBase64) => {
    // 1. Generate a random AES key
    const aesKey = await window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    // 2. Encrypt the text with AES
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);
    const encryptedText = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encodedText
    );

    // 3. Encrypt the AES key with Recipient's RSA Public Key
    const binaryKey = Uint8Array.from(atob(recipientPublicKeyBase64), c => c.charCodeAt(0));
    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        binaryKey,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );

    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedAesKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        exportedAesKey
    );

    // 4. Return combined package (Base64)
    return JSON.stringify({
        iv: btoa(String.fromCharCode(...iv)),
        key: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
        data: btoa(String.fromCharCode(...new Uint8Array(encryptedText))),
    });
};

export const decryptMessage = async (encryptedPackageJson, myPrivateKeyBase64) => {
    const pkg = JSON.parse(encryptedPackageJson);

    // 1. Decrypt the AES Key using my RSA Private Key
    const binaryPrivateKey = Uint8Array.from(atob(myPrivateKeyBase64), c => c.charCodeAt(0));
    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        binaryPrivateKey,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"]
    );

    const encryptedAesKey = Uint8Array.from(atob(pkg.key), c => c.charCodeAt(0));
    const aesKeyRaw = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedAesKey
    );

    const aesKey = await window.crypto.subtle.importKey(
        "raw",
        aesKeyRaw,
        { name: "AES-GCM" },
        true,
        ["decrypt"]
    );

    // 2. Decrypt the data using the AES key
    const iv = Uint8Array.from(atob(pkg.iv), c => c.charCodeAt(0));
    const encryptedData = Uint8Array.from(atob(pkg.data), c => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encryptedData
    );

    return new TextDecoder().decode(decryptedBuffer);
};

// For Vault Key Encryption (Symmetric using a password deriving a key)
export const deriveKeyFromPassword = async (password, saltBase64 = "default-salt") => {
    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode(saltBase64),
            iterations: 100000,
            hash: "SHA-256",
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

export const encryptVaultKey = async (vaultKey, password) => {
    const key = await deriveKeyFromPassword(password);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        new TextEncoder().encode(vaultKey)
    );

    return JSON.stringify({
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    });
};

export const decryptVaultKey = async (encryptedPackageJson, password) => {
    const pkg = JSON.parse(encryptedPackageJson);
    const key = await deriveKeyFromPassword(password);
    const iv = Uint8Array.from(atob(pkg.iv), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(pkg.data), c => c.charCodeAt(0));

    const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
    );

    return new TextDecoder().decode(decrypted);
};
