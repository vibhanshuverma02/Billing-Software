// app/api/admin/approve/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/db';
import { SendWelcomeEmail } from '@/helpers/Sendemail';

export async function GET(req: Request) {
  console.log('🔍 approve GET called:', req.url);
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.subscriptionStatus === 'approved') {
      return NextResponse.json({ error: 'Invalid or already approved user' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: 'approved', subscriptionApprovedAt: new Date() },
    });

    await SendWelcomeEmail(user.email, user.username, 'Use your existing password to log in');

    return new NextResponse(`<h2>User ${user.username} approved. Email sent.</h2>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err) {
    console.error('❗Approval token error:', err);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
