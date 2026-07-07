import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('resume') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    if (name.endsWith('.pdf')) {
      const pdfParser = new PDFParse({ data: buffer, verbosity: 0 as any });
      const data = await pdfParser.getText();
      return NextResponse.json({ text: data.text || '' });
    }

    if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: result.value || '' });
    }

    if (name.endsWith('.doc')) {
      return NextResponse.json({ text: 'DOC parsing is not supported in this environment. Please paste the résumé text manually instead.' });
    }

    return NextResponse.json({ text: '' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to parse resume' }, { status: 500 });
  }
}
