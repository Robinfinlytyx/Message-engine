import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db/db';
import { eq, and } from 'drizzle-orm';
import { config } from '../config';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || config.encryptionKey || 'fallback_secret_key_change_me_in_production';
const JWT_EXPIRES_IN = '1d'; // 1 day
const REFRESH_TOKEN_DAYS = 7;

export interface TokenPayload {
    userId: string;
    orgId?: string;
    userType: 'user' | 'super_admin';
    role?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

class AuthService {
    /**
     * Hash a plaintext password
     */
    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    /**
     * Verify a password against a hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate an access token from a payload
     */
    generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    /**
     * Generate a random refresh token
     */
    generateRefreshToken(): string {
        return randomBytes(40).toString('hex');
    }

    /**
     * Create a session and return auth tokens
     */
    async createSession(payload: TokenPayload): Promise<AuthTokens> {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

        await db.insert(schema.userSessions).values({
            userId: payload.userId,
            userType: payload.userType,
            refreshToken,
            expiresAt,
        });

        return { accessToken, refreshToken };
    }

    /**
     * Revoke a refresh token
     */
    async revokeSession(refreshToken: string): Promise<boolean> {
        const [deleted] = await db
            .delete(schema.userSessions)
            .where(eq(schema.userSessions.refreshToken, refreshToken))
            .returning();
            
        return !!deleted;
    }

    /**
     * Verify and decode a JWT access token
     */
    verifyAccessToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (error) {
            return null;
        }
    }
}

export const authService = new AuthService();
