/**
 * Shared TypeScript types for the AI Avatar Chatbot.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  content: string;
}

export type TTSStatus = 'loading' | 'ready' | 'speaking' | 'error';

export type AvatarStatus = 'loading' | 'ready' | 'error';

export interface ChatApiRequest {
  message: string;
  history: { role: string; content: string }[];
}

export interface ChatApiResponse {
  response: string;
}
