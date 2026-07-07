import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.emailLog.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const record = await prisma.emailLog.update({
    where: { id },
    data: {
      dateSent: new Date(),
      status: 'sent',
      resendCount: existing.resendCount + 1
    }
  });
  return NextResponse.json(record);
}
