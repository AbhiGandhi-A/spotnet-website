import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    // For stateless JWT, logout is handled on client by deleting tokens.
    // If using sessions, remove session from DB here.
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch {
    return NextResponse.json({ success: false, error: 'Logout error' }, { status: 500 });
  }
}
