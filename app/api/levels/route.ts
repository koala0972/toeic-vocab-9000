import { NextResponse } from 'next/server';
import { TOTAL_LEVELS, WORDS_PER_LEVEL, TIERS } from '@/lib/levels-config';

export async function GET() {
  return NextResponse.json({
    total_levels: TOTAL_LEVELS,
    words_per_level: WORDS_PER_LEVEL,
    total_words: TOTAL_LEVELS * WORDS_PER_LEVEL,
    tiers: TIERS.map(t => ({
      name: t.name,
      zhName: t.zhName,
      from: t.levels[0],
      to: t.levels[1],
      cefr: `${t.cefrRange[0]}-${t.cefrRange[1]}`,
      toeic: `${t.toeicRange[0]}-${t.toeicRange[1]}`,
      wordCount: (t.levels[1] - t.levels[0] + 1) * WORDS_PER_LEVEL,
    })),
  });
}
