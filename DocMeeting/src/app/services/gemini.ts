import { Injectable } from '@angular/core';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private model: ChatGoogleGenerativeAI;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: environment.apiKey,
      model: 'gemini-flash-latest', 
      maxRetries: 3,
      temperature: 0.2,
    });
  }

  async analyzeMeeting(file: File, fileContent: string | ArrayBuffer): Promise<any> {
    try {
      this.validateMimeType(file.type);

      const meetingSchema = z.object({
        category: z.string().describe("Uma categoria curta para a reunião"),
        quickSummary: z.string().describe("Uma frase resumindo o tópico principal"),
        styledContent: z.string().describe("O conteúdo da ata formatado em HTML.")
      });

      const structuredModel = this.model.withStructuredOutput(meetingSchema);

      const systemInstruction = new SystemMessage(`
        ATUE COMO: Um Assistente Executivo Sênior...
        (Mantenha seu prompt aqui, ele está ótimo)
      `);

      let contentParts: any[] = [];

      if (file.type.startsWith('text/')) {
        let textData = '';
        if (typeof fileContent === 'string') {
          textData = fileContent;
        } else if (fileContent instanceof ArrayBuffer) {
          const decoder = new TextDecoder('utf-8');
          textData = decoder.decode(fileContent);
        }
        contentParts.push({ 
          type: "text", 
          text: `Conteúdo da reunião (Texto/Log):\n${textData}` 
        });
      } 
      
      else {
        const buffer = typeof fileContent === 'string' 
          ? new TextEncoder().encode(fileContent).buffer
          : fileContent;

        // 🔥 OTIMIZAÇÃO AQUI: Conversão Assíncrona Rápida
        const base64 = await this.bufferToBase64Async(buffer);
        
        const mimeType = file.type || 'application/octet-stream';

        // Envia como 'media' para evitar o erro "model does not support images"
        contentParts.push({
          type: "media", 
          mimeType: mimeType,
          data: base64
        } as any);
      }

      const userMessage = new HumanMessage({ content: contentParts });

      console.log('🤖 Enviando para o Gemini...');
      const response = await structuredModel.invoke([systemInstruction, userMessage]);
      return response; 

    } catch (error) {
      console.error("ERRO GEMINI:", error);
      throw error;
    }
  }

  private validateMimeType(mimeType: string): void {
    const isText = mimeType.startsWith('text/');
    const isAudio = mimeType.startsWith('audio/');
    const isVideo = mimeType.startsWith('video/');
    
    if (mimeType.startsWith('image/')) {
      throw new Error(`Imagens (${mimeType}) não são suportadas. Use Áudio, Vídeo ou Texto.`);
    }

    if (!isText && !isAudio && !isVideo) {
      throw new Error(`Formato não suportado: ${mimeType}`);
    }
  }

  private bufferToBase64Async(buffer: ArrayBuffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer]);
      const reader = new FileReader();
      
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Remove o prefixo "data:audio/wav;base64," para pegar só os dados
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      
      reader.onerror = (error) => reject(error);
      
      reader.readAsDataURL(blob);
    });
  }
}