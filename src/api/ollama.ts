import axios from 'axios';

const OLLAMA_API_BASE = 'http://localhost:11434/api';

export interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export const generateResponse = async (messages: ChatMessage[]) => {
  try {
    const response = await axios.post(`${OLLAMA_API_BASE}/chat`, {
      model: 'llama2',
      messages: messages,
      stream: false,
    });
    return response.data.message;
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    throw error;
  }
};
