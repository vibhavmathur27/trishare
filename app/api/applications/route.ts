import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.application.findMany({
    orderBy: { dateApplied: 'desc' },
    include: { resumeVersions: true }
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const company = (form.get('company') as string) || '';
  const role = (form.get('role') as string) || '';
  const source = (form.get('source') as string) || '';
  const dateApplied = (form.get('dateApplied') as string) || '';
  const jobDescription = (form.get('jobDescription') as string) || '';
  const notes = (form.get('notes') as string) || '';
  const file = form.get('resume') as File | null;

  if (!company || !role) {
    return NextResponse.json({ error: 'company and role are required' }, { status: 400 });
  }

  const resumeVersions: { originalName: string; blobUrl: string }[] = [];
  if (file && file.size > 0) {
    const blob = await put(`resumes/${Date.now()}-${file.name}`, file, { access: 'public' });
    resumeVersions.push({ originalName: file.name, blobUrl: blob.url });
  }

  const record = await prisma.application.create({
    data: {
      company,
      role,
      source,
      dateApplied: dateApplied ? new Date(dateApplied) : new Date(),
      jobDescription,
      notes,
      status: 'applied',
      resumeVersions: { create: resumeVersions }
    },
    include: { resumeVersions: true }
  });

  return NextResponse.json(record);
}
