export interface Meeting {
  id: string;
  category: string;      // Ex: "Daily Scrum", "Alinhamento Técnico"
  summary: string;       // O resumo curto para a tabela
  fullContent: string;   // O HTML completo gerado pela IA para o Modal
  date: Date;            // Data da criação
  fileName: string;      // Nome do arquivo original
  fileType: 'audio' | 'video' | 'text'; // Tipo do arquivo para ícones ou lógica futura
}