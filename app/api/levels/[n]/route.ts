import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { levelToTier } from '@/lib/levels-config';

export async function GET(
  req: Request,
  { params }: { params: { n: string } }
) {
  const levelNum = parseInt(params.n, 10);
  if (isNaN(levelNum) || levelNum < 1 || levelNum > 900) {
    return NextResponse.json(
      { error: 'invalid_level', message: 'Level must be 1-900' },
      { status: 404 }
    );
  }
  const tier = levelToTier(levelNum);
  const filePath = join(process.cwd(), 'data', 'levels', tier, `${levelNum}.json`);
  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: 'not_generated', message: `Level ${levelNum} not yet generated`, level: levelNum },
      { status: 404 }
    );
  }
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'parse_error', message: err?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
