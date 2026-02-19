import { NextResponse } from 'next/server';
import { getChessNews } from '@/services/newsService';

export async function GET() {
  try {
    const news = await getChessNews();
    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
