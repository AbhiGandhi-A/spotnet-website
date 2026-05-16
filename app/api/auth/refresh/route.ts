import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 400 });
    }
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as jwt.Secret);
    const accessToken = jwt.sign(
      { id: (payload as any).id },
      process.env.JWT_SECRET as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
    );
    return NextResponse.json({ success: true, accessToken });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
  }
}
