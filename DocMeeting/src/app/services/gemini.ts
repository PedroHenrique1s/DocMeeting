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
        ATUE COMO: Um Assistente Executivo Sênior altamente qualificado e especialista em documentação corporativa.
        SEU OBJETIVO: Analisar a transcrição ou registro de uma reunião e produzir uma Ata de Reunião profissional, clara e acionável.
        DIRETRIZES DE ANÁLISE:
        1. Identificação do Tema: Determine o objetivo central da reunião logo no início.
        2. Filtragem de Ruído: Ignore conversas paralelas, piadas ou "small talk" que não agregam ao negócio. Foco total em decisões e informações.
        3. Estruturação Lógica: Não transcreva cronologicamente (quem falou o quê). Em vez disso, agrupe por TÓPICOS.
        4. Itens de Ação (Action Items): Identifique claramente: O que deve ser feito? Quem é o responsável? Qual o prazo (se mencionado)?
        5. Decisões Tomadas: Destaque explicitamente o que foi martelado/decidido.
        DIRETRIZES DE FORMATAÇÃO (HTML para styledContent):
        - O campo 'styledContent' deve ser um HTML rico e visualmente agradável.
        - Use <h2> para títulos das seções (ex: "Pauta", "Decisões", "Próximos Passos").
        - Use <ul> e <li> para listas, facilitando a leitura rápida.
        - Use <strong> para destacar nomes de responsáveis, prazos e decisões críticas.
        - Se houver impedimentos ou riscos mencionados, crie uma seção de <h3 style="color: #d9534f">⚠️ Pontos de Atenção</h3>.
        TOM DE VOZ:
        - Profissional, impessoal e direto.
        - Use a norma culta, mas com linguagem corporativa moderna.
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

      }else {
        const buffer = typeof fileContent === 'string'
          ? new TextEncoder().encode(fileContent).buffer
          : fileContent;
        
        const base64 = this.arrayBufferToBase64(buffer);
        const mimeType = file.type || 'application/octet-stream';
        contentParts.push({
          type: "media",
          mimeType: mimeType,
          data: base64
        } as any);
      }

      const userMessage = new HumanMessage({ content: contentParts });
      const response = await structuredModel.invoke([systemInstruction, userMessage]);
      return response;

    } catch (error) {
      console.error("ERRO DETALHADO:", error);
      throw error;
    }
  }

  private validateMimeType(mimeType: string): void {
    const isText = mimeType.startsWith('text/');
    const isAudio = mimeType.startsWith('audio/');
    const isVideo = mimeType.startsWith('video/');
    if (mimeType.startsWith('image/')) throw new Error(`Imagens (${mimeType}) não são suportadas para geração de Atas. Use Áudio, Vídeo ou Texto.`);
    if (!isText && !isAudio && !isVideo) throw new Error(`Formato de arquivo não suportado: ${mimeType}`);
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