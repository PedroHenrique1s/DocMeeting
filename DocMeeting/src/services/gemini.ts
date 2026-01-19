import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: environment.apiKey
    });
  }

  async analyzeMeeting(file: File, fileContent: string | ArrayBuffer): Promise<any> {
    try {
      const MODEL_NAME = 'gemini-flash-latest'; 
      console.log(`--- Processando arquivo: ${file.name} (${file.type}) ---`);

      const systemPrompt = `
        Você é um assistente administrativo eficiente atuando em nome da Pessoa.
        Analise o registro desta reunião e gere a Ata da Daily Scrum.
        Gere um resumo completo com todas informações descritas trazendo informação clara.
        
        SAÍDA OBRIGATÓRIA (JSON):
        Retorne APENAS um objeto JSON com a seguinte estrutura, sem markdown em volta:
        {
          "category": "Uma categoria curta (ex: Alinhamento de cadastro)",
          "quickSummary": "Uma frase resumindo o que entrou (ex: Definição de prazos para o módulo X)",
          "styledContent": "O conteúdo completo da ata formatado em HTML bonito (use tags <h2>, <ul>, <strong>, etc) para ser exibido diretamente em um site."
        }
      `;

      let parts: any[] = [{ text: systemPrompt }];

      if (typeof fileContent === 'string') {
        console.log('Detectado conteúdo de TEXTO');
        parts.push({ text: `Conteúdo da reunião:\n${fileContent}` });
      
      } else if (fileContent instanceof ArrayBuffer) {
        console.log('Detectado conteúdo BINÁRIO (Imagem/Áudio)');
        const base64Data = this.arrayBufferToBase64(fileContent);
        
        parts.push({
          inlineData: {
            mimeType: file.type || 'application/octet-stream',
            data: base64Data
          }
        });
      }

      return await this.generateWithRetry(MODEL_NAME, parts);

    } catch (error) {
      console.error("ERRO FINAL:", error);
      throw error;
    }
  }

  private async generateWithRetry(modelName: string, parts: any[], attempts = 0): Promise<any> {
    const maxAttempts = 3;
    
    try {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: parts }],
        config: { responseMimeType: 'application/json' }
      });

      console.log('Sucesso! Processando resposta...');
      
      const jsonString = this.extractTextFromResponse(response);
      
      console.log('Texto extraído:', jsonString);
      return JSON.parse(jsonString || '{}');

    } catch (error: any) {
      const errString = error.toString();
      const isRetryable = 
        error.status === 429 || 
        error.status === 503 || 
        errString.includes('429') ||
        errString.includes('Network') ||
        errString.includes('Failed to fetch');

      if (isRetryable && attempts < maxAttempts) {
        console.warn(`Tentativa ${attempts + 1} falhou. Retentando em 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.generateWithRetry(modelName, parts, attempts + 1);
      } else {
        throw error;
      }
    }
  }

  // --- FUNÇÃO SALVA-VIDAS ---
  // Tenta pegar o texto seja lá como ele veio (Função, Propriedade ou Array)
  private extractTextFromResponse(response: any): string {
    if (!response) return '{}';

    // 1. Tenta como função (padrão antigo)
    if (typeof response.text === 'function') {
      return response.text();
    }
    
    // 2. Tenta como propriedade (padrão Python/Novo JS)
    if (typeof response.text === 'string') {
      return response.text;
    }

    // 3. Tenta cavar no objeto JSON bruto (Padrão REST)
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text || '{}';
      }
    }

    console.warn('Formato de resposta desconhecido:', response);
    return '{}';
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}