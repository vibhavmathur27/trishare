import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.callLog.findMany({ orderBy: { dateCalled: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, company, role, phone, dateCalled, nextFollowUp, notes } = body;
  if (!name || !phone) {
    return NextResponse.json({ error: 'name and phone are required' }, { status: 400 });
  }
  const record = await prisma.callLog.create({
    data: {
      name,
      company: company || '',
      role: role || '',
      phone,
      dateCalled: dateCalled ? new Date(dateCalled) : new Date(),
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
      notes: notes || '',
      outcome: 'connected'
    }
  });
  return NextResponse.json(record);
}
