const fs = require('fs');
const path = require('path');

const files = [
  path.join(process.cwd(), 'src', 'App.jsx'),
  path.join(process.cwd(), 'src', 'data', 'seedData.js'),
  path.join(process.cwd(), 'src', 'components', 'OrgNode.jsx')
];

const replacements = {
  // Triple/Double Corrupted (common when multiple encodings are mixed)
  "ÃÂ¡": "á", "ÃÂ ": "à", "ÃÂ¢": "â", "ÃÂ£": "ã", "ÃÂ©": "é", "ÃÂª": "ê", "ÃÂ­": "í", "ÃÂ³": "ó", "ÃÂ´": "ô", "ÃÂµ": "õ", "ÃÂº": "ú", "ÃÂ§": "ç",
  "ÃÂ ": "Á", "ÃÂ€": "À", "ÃÂ‚": "Â", "ÃÂƒ": "Ã", "ÃÂ‰": "É", "ÃÂŠ": "Ê", "ÃÂ\u008d": "Í", "ÃÂ“": "Ó", "ÃÂ”": "Ô", "ÃÂ•": "Õ", "ÃÂš": "Ú", "ÃÂ‡": "Ç",
  
  // Single Corrupted (standard mojibake)
  "Ã¡": "á", "Ã ": "à", "Ã¢": "â", "Ã£": "ã", "Ã©": "é", "Ãª": "ê", "Ã­": "í", "Ã³": "ó", "Ã´": "ô", "Ãµ": "õ", "Ãº": "ú", "Ã§": "ç",
  "Ã ": "Á", "Ã€": "À", "Ã‚": "Â", "Ãƒ": "Ã", "Ã‰": "É", "ÃŠ": "Ê", "Ã\u008d": "Í", "Ã“": "Ó", "Ã”": "Ô", "Ã•": "Õ", "Ãš": "Ú", "Ã‡": "Ç",
  
  "â€”": "—", "â€“": "–", "â€¢": "•", "â€œ": "“", "â€": "”", "â€˜": "‘", "â€™": "’", "â€¦": "…", "âš": "⚠", "âœ…": "✅", "âŒ": "❌",
  "â•": "═", "â”": "─", "â—": "●", "âš™": "⚙", "ï¸": "",
  
  // Specific sequences found in logs
  "ServiÃÂ§o": "Serviço",
  "TÃÂ©rmino": "Término",
  "UsuÃ¡rio": "Usuário",
  "Pessoa nÃ£o encontrada": "Pessoa não encontrada",
  "SincronizaÃ§Ã£o": "Sincronização",
  "concluÃ­da": "concluída",
  "AtenÃ§Ã£o": "Atenção"
};

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    Object.entries(replacements).forEach(([bad, good]) => {
      content = content.split(bad).join(good);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Deep fixed mojibake in ${path.basename(filePath)}`);
  }
});
