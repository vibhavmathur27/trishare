import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if (body.outcome !== undefined) data.outcome = body.outcome;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.nextFollowUp !== undefined) data.nextFollowUp = body.nextFollowUp ? new Date(body.nextFollowUp) : null;

  try {
    const record = await prisma.callLog.update({ where: { id }, data });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.callLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
