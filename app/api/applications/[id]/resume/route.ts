import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await req.formData();
  const file = form.get('resume') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'no file uploaded' }, { status: 400 });
  }

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const blob = await put(`resumes/${Date.now()}-${file.name}`, file, { access: 'public' });

  await prisma.resumeVersion.create({
    data: { applicationId: id, originalName: file.name, blobUrl: blob.url }
  });

  const record = await prisma.application.findUnique({
    where: { id },
    include: { resumeVersions: true }
  });
  return NextResponse.json(record);
}
