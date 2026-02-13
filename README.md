# DocMeeting 📄✨

O **DocMeeting** é um agente de IA (SaaS) projetado para transformar reuniões em planos de ação. O projeto nasceu de um desafio no **Hackathon Olímpia 2026**, com o objetivo de otimizar a produtividade de equipes através da geração automática de atas e identificação de tarefas.

## 🚀 Funcionalidades

- **Transcrição e Resumo:** Converte áudios e vídeos de reuniões em resumos estruturados.
- **Identificação de Tarefas:** IA que detecta automaticamente responsáveis e prazos citados.
- **Edição Flexível:** Modos de edição Visual e Código (HTML) para personalização total.
- **Distribuição Ágil:** Envio direto do resultado formatado por e-mail para a equipe.
- **Sistema de Créditos:** Gerenciamento de uso por usuário integrado ao Supabase.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [Angular](https://angular.io/) (Especialidade do desenvolvedor)
- **Backend/Database:** [Supabase](https://supabase.com/) (Auth, Database e RLS)
- **IA:** [LangChain](https://www.langchain.com/) & Google Gemini
- **Estilização:** SCSS com foco em UX/UI moderna.
- **Deploy:** Vercel com CI/CD automatizado.

## ⚙️ Configuração do Ambiente

Para rodar o projeto localmente, siga os passos abaixo:

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/doc-meeting.git](https://github.com/seu-usuario/doc-meeting.git)
   cd doc-meeting

2. **Instalação das Dependências:**
   ```bash
   npm install

3. **Configuração de Variáveis de Ambiente:**
   ```bash
   export const environment = {
      production: false,
      apiKey: 'SUA_GOOGLE_GEMINI_KEY',
      supabaseUrl: 'SUA_SUPABASE_URL',
      supabaseKey: 'SUA_SUPABASE_ANON_KEY'
    };

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   ng serve
