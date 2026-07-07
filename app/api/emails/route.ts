import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.emailLog.findMany({ orderBy: { dateSent: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, company, role, email, subject, dateSent, notes, draft } = body;
  if (!name || !email) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
  }
  const record = await prisma.emailLog.create({
    data: {
      name,
      company: company || '',
      role: role || '',
      email,
      subject: subject || '',
      dateSent: dateSent ? new Date(dateSent) : new Date(),
      notes: notes || '',
      draft: draft || '',
      status: 'sent'
    }
  });
  return NextResponse.json(record);
}
