// Auth utility
import jwt from 'jsonwebtoken';

export function signJWT(payload: object, expiresIn: string, secret: jwt.Secret = process.env.JWT_SECRET!) {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyJWT(token: string, secret = process.env.JWT_SECRET!) {
  return jwt.verify(token, secret);
}
