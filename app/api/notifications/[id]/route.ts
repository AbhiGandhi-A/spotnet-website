// DELETE /api/notifications/[id] - Delete a notification
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { withAuth } from '@/middleware/auth';

export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { db } = await connectToDatabase();
  const id = params.id;
  await db.collection('notifications').deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
});
