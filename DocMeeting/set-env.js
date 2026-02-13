const fs = require('fs');
const path = require('path');

const envDirectory = path.join(__dirname, 'src/environments');
const targetPath = path.join(envDirectory, 'environment.ts');

const envConfigFile = `export const environment = {
  production: true,
  apiKey: '${process.env.GOOGLE_API_KEY || ""}',
  supabaseUrl: '${process.env.SUPABASE_URL || ""}',
  supabaseKey: '${process.env.SUPABASE_KEY || ""}'
};
`;

if (!fs.existsSync(envDirectory)) {
  fs.mkdirSync(envDirectory, { recursive: true });
}

fs.writeFileSync(targetPath, envConfigFile);
console.log("Configurações de IA e Supabase injetadas com sucesso!");