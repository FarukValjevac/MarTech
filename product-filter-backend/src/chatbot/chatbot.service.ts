import { Injectable } from '@nestjs/common';

interface OllamaResponse {
  response: string;
}

@Injectable()
export class ChatbotService {
  private readonly ollamaUrl = 'http://localhost:11434/api/generate';

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await fetch(this.ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: message,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as OllamaResponse;
      return data.response;
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error('Failed to get response from chatbot');
    }
  }
}
