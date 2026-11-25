import { NextRequest, NextResponse } from 'next/server';
import { aiProviderManager } from '@/lib/server/ai/router';

export async function GET(req: NextRequest) {
  try {
    const ollamaUrl = req.nextUrl.searchParams.get('ollama_url') || req.headers.get('x-ollama-url');
    if (ollamaUrl) {
      aiProviderManager.setOllamaBaseUrl(ollamaUrl);
    }

    const health = await aiProviderManager.getOverallHealth();
    return NextResponse.json({
      ...health,
      ollamaBaseUrl: aiProviderManager.getOllama().getBaseUrl(),
    });
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
    const { mode, ollamaBaseUrl, ollama_url } = body;

    const targetOllamaUrl = ollamaBaseUrl || ollama_url;
    if (targetOllamaUrl && typeof targetOllamaUrl === 'string') {
      aiProviderManager.setOllamaBaseUrl(targetOllamaUrl);
    }

    if (mode === 'gemini' || mode === 'ollama' || mode === 'hybrid') {
      aiProviderManager.setMode(mode);
    }

    const updatedHealth = await aiProviderManager.getOverallHealth();
    return NextResponse.json({
      success: true,
      activeMode: aiProviderManager.getMode(),
      ollamaBaseUrl: aiProviderManager.getOllama().getBaseUrl(),
      health: updatedHealth,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
