import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DOWNLOAD_DIR = path.join(process.cwd(), 'download');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file) {
    const files = [
      { name: 'jaramana-part-aa', size: '50 MB' },
      { name: 'jaramana-part-ab', size: '50 MB' },
      { name: 'jaramana-part-ac', size: '50 MB' },
      { name: 'jaramana-part-ad', size: '50 MB' },
      { name: 'jaramana-part-ae', size: '40 MB' },
      { name: 'jaramana-net-android-source.zip', size: '264 KB' },
    ];
    return NextResponse.json({ files });
  }

  const allowedFiles = [
    'jaramana-part-aa',
    'jaramana-part-ab',
    'jaramana-part-ac',
    'jaramana-part-ad',
    'jaramana-part-ae',
    'jaramana-net-android-source.zip',
  ];

  if (!allowedFiles.includes(file)) {
    return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
  }

  const filePath = path.join(DOWNLOAD_DIR, file);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
