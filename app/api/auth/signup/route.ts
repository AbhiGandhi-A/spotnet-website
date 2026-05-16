import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();
    if (!email || !username || !password) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }
    const { db } = await connectToDatabase();
    const existing = await db.collection('users').findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const now = new Date();
    const user = {
      email,
      username,
      password: hashed,
      friends: [],
      friendRequests: [],
      sessions: [],
      notifications: [],
      rooms: [],
      createdAt: now,
      updatedAt: now,
      online: false,
    };
    const result = await db.collection('users').insertOne(user);
    const accessToken = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_SECRET! as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
    );
    const refreshToken = jwt.sign(
      { id: result.insertedId },
      process.env.JWT_REFRESH_SECRET! as jwt.Secret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
    return NextResponse.json({
      success: true,
      user: { id: result.insertedId, email, username },
      accessToken,
      refreshToken,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
