import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function withAuth(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET!);
      (req as any).user = user;
      return handler(req, ...args);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
  };
}
