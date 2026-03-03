import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCODING: BufferEncoding = 'hex';

/**
 * CryptoService — AES-256-GCM encryption/decryption for sensitive project credentials.
 * 
 * The master encryption key is read from the ENCRYPTION_KEY env var (32 bytes / 64 hex chars).
 * Each encrypted value stores: IV + AuthTag + Ciphertext (all hex-encoded, colon-separated).
 */
class CryptoService {
    private getKey(): Buffer {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            throw new Error('ENCRYPTION_KEY environment variable is not set');
        }
        if (key.length !== 64) {
            throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
        }
        return Buffer.from(key, 'hex');
    }

    /**
     * Encrypt a plaintext string.
     * Returns a colon-separated string: iv:authTag:ciphertext (all hex-encoded).
     */
    encrypt(plaintext: string): string {
        const key = this.getKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
        encrypted += cipher.final(ENCODING);

        const authTag = cipher.getAuthTag();

        return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
    }

    /**
     * Decrypt an encrypted string (iv:authTag:ciphertext format).
     * Returns the original plaintext.
     */
    decrypt(encryptedText: string): string {
        const key = this.getKey();
        const parts = encryptedText.split(':');

        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format — expected iv:authTag:ciphertext');
        }

        const [ivHex, authTagHex, ciphertext] = parts;
        const iv = Buffer.from(ivHex, ENCODING);
        const authTag = Buffer.from(authTagHex, ENCODING);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext, ENCODING, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Mask a sensitive value for display (e.g., "sk_live_abc123" → "****c123").
     */
    mask(value: string, visibleChars: number = 4): string {
        if (!value || value.length <= visibleChars) {
            return '****';
        }
        return '****' + value.slice(-visibleChars);
    }

    /**
     * Generate a new random encryption key (for initial setup).
     * Returns a 64-char hex string.
     */
    static generateKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }
}

export const cryptoService = new CryptoService();
