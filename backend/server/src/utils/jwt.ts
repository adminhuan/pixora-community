import crypto from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser } from '../types/common';
import { AppError } from './AppError';

export interface JwtClaims {
  sub: string;
  username: string;
  role: AuthUser['role'];
  type: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}

const signToken = (payload: Omit<JwtClaims, 'jti' | 'iat' | 'exp'>, secret: string, expiresIn: string): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(
    {
      ...payload,
      jti: crypto.randomUUID()
    },
    secret,
    options
  );
};

export const signAccessToken = (user: AuthUser): string => {
  return signToken(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      type: 'access'
    },
    config.jwt.accessSecret,
    config.jwt.accessExpiresIn
  );
};

export const signRefreshToken = (user: AuthUser): string => {
  return signToken(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      type: 'refresh'
    },
    config.jwt.refreshSecret,
    config.jwt.refreshExpiresIn
  );
};

const verifyToken = (token: string, secret: string): JwtClaims => {
  try {
    return jwt.verify(token, secret) as JwtClaims;
  } catch {
    throw new AppError('Token 无效或已过期', {
      statusCode: 401,
      code: 'UNAUTHORIZED'
    });
  }
};

export const verifyAccessToken = (token: string): JwtClaims => {
  const payload = verifyToken(token, config.jwt.accessSecret);
  if (payload.type !== 'access') {
    throw new AppError('Token 类型错误', {
      statusCode: 401,
      code: 'UNAUTHORIZED'
    });
  }
  return payload;
};

export const verifyRefreshToken = (token: string): JwtClaims => {
  const payload = verifyToken(token, config.jwt.refreshSecret);
  if (payload.type !== 'refresh') {
    throw new AppError('Token 类型错误', {
      statusCode: 401,
      code: 'UNAUTHORIZED'
    });
  }
  return payload;
};

export const decodeWithoutVerify = (token: string): JwtPayload | null => {
  return jwt.decode(token) as JwtPayload | null;
};
