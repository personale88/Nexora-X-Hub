import { NextRequest, NextResponse } from 'next/server';
import { aiProviderManager } from '@/lib/server/ai/router';

export async function GET(req: NextRequest) {
  try {
    const health = await aiProviderManager.getOverallHealth();
    return NextResponse.json(health);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'HEALTH_CHECK_FAILED', message: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode } = body;
    if (mode === 'gemini' || mode === 'ollama' || mode === 'hybrid') {
      aiProviderManager.setMode(mode);
      return NextResponse.json({ success: true, activeMode: mode });
    }
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
