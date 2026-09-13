import { DiagnosisResult, Language } from '../types';

export async function diagnoseCrop(
  crop: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  language: Language = 'en'
): Promise<DiagnosisResult> {
  const response = await fetch('/api/diagnose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      crop,
      imageBase64,
      mimeType,
      language,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Diagnosis service error (HTTP ${response.status})`);
  }

  const data: DiagnosisResult = await response.json();
  return data;
}

export async function streamChatMessage(
  message: string,
  history: Array<{ role: string; parts: any }> = [],
  language: Language = 'en',
  onChunk: (chunk: string, fullText: string, isDemo: boolean) => void,
  signal?: AbortSignal
): Promise<{ reply: string; isDemo: boolean }> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      message,
      history,
      language,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat assistant error (HTTP ${response.status})`);
  }

  if (!response.body) {
    throw new Error('Streaming response body is not readable.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let isDemoResult = false;
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          currentEvent = 'message';
          continue;
        }

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
          continue;
        }

        if (trimmed.startsWith('data:')) {
          const dataContent = trimmed.slice(5).trim();
          if (dataContent === '[DONE]') {
            return { reply: accumulatedText, isDemo: isDemoResult };
          }

          try {
            const parsed = JSON.parse(dataContent);
            if (currentEvent === 'error' || parsed.error) {
              throw new Error(parsed.error || 'Live assistant stream error');
            }

            if (parsed.isDemo !== undefined) {
              isDemoResult = Boolean(parsed.isDemo);
            }

            if (currentEvent === 'done') {
              if (parsed.isDemo !== undefined) {
                isDemoResult = Boolean(parsed.isDemo);
              }
              return { reply: accumulatedText, isDemo: isDemoResult };
            }

            if (currentEvent === 'chunk' || parsed.text) {
              const chunkText = parsed.text || '';
              accumulatedText += chunkText;
              onChunk(chunkText, accumulatedText, isDemoResult);
            }
          } catch (err: any) {
            if (err.message && err.message !== 'Unexpected end of JSON input') {
              console.warn('SSE parse issue:', err);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { reply: accumulatedText, isDemo: isDemoResult };
}

export async function sendChatMessage(
  message: string,
  history: Array<{ role: string; parts: any }> = [],
  language: Language = 'en'
): Promise<{ reply: string; isDemo: boolean }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
      language,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat assistant error (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data;
}

export async function checkBackendHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { status: 'error', geminiConfigured: false };
    return await res.json();
  } catch {
    return { status: 'offline', geminiConfigured: false };
  }
}
