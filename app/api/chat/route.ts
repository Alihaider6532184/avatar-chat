import { NextResponse } from 'next/server';

const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_URL = process.env.LLM_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const LLM_MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a friendly, helpful AI assistant. Keep your responses concise and conversational — ideally under 3 sentences unless the user asks for more detail. Your responses will be spoken aloud by a 3D avatar, so avoid using markdown formatting, code blocks, or bullet points. Speak naturally.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string.' },
        { status: 400 }
      );
    }

    if (!LLM_API_KEY) {
      console.error('[API Route /chat] LLM_API_KEY is not configured.');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API Key.' },
        { status: 500 }
      );
    }

    // Format messages for OpenAI-compatible endpoint
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    
    if (Array.isArray(history)) {
      for (const entry of history) {
        if (entry.role && entry.content) {
          messages.push({ role: entry.role, content: entry.content });
        }
      }
    }
    
    messages.push({ role: 'user', content: message });

    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Route /chat] LLM API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `LLM API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Parse response
    let assistantMessage = '';
    if (data.choices && data.choices.length > 0) {
      assistantMessage = data.choices[0].message.content;
    } else {
      console.error('[API Route /chat] Unexpected response format:', data);
      return NextResponse.json(
        { error: 'Unexpected response format from LLM API' },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: assistantMessage });
    
  } catch (error: unknown) {
    console.error('[API Route /chat] Internal Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while communicating with the AI.' },
      { status: 500 }
    );
  }
}
