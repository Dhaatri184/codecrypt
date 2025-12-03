import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '@codecrypt/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  githubId: string;
  githubUsername: string;
}

export class AuthService {
  generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      githubId: user.githubId,
      githubUsername: user.githubUsername,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async encryptToken(token: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(token, saltRounds);
  }

  async compareToken(token: string, hashedToken: string): Promise<boolean> {
    return bcrypt.compare(token, hashedToken);
  }
}

export const authService = new AuthService();
