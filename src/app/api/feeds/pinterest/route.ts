import { NextResponse } from 'next/server';
import { generateProductFeed } from '@/lib/feeds';

export async function GET() {
  try {
    const xml = await generateProductFeed('pinterest');

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[PINTEREST_FEED_ERROR]', error);
    return new NextResponse(`Error generating feedback: ${error?.message || 'Unknown error'}`, { status: 500 });
  }
}
