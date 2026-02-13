const fs = require('fs');
const path = require('path');

const envDirectory = path.join(__dirname, 'src/environments');
const targetPath = path.join(envDirectory, 'environment.ts');

// Conteúdo que será escrito no arquivo
const envConfigFile = `export const environment = {
  production: true,
  apiKey: '${process.env.API_KEY || ""}',
  supabaseUrl: '${process.env.SUPABASE_URL || ""}',
  supabaseKey: '${process.env.SUPABASE_KEY || ""}'
};
`;

// Cria o diretório caso não exista e escreve o arquivo
if (!fs.existsSync(envDirectory)) {
  fs.mkdirSync(envDirectory, { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);
console.log(`✅ Environment gerado em ${targetPath}`);