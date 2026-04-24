const fs = require("fs");
const file = "src/App.jsx";
let s = fs.readFileSync(file, "utf8");

// Remove invisíveis perigosos
s = s
  .replace(/\u00AD/g, "")
  .replace(/\u200B/g, "")
  .replace(/\u200C/g, "")
  .replace(/\u200D/g, "")
  .replace(/\uFEFF/g, "");

// Substituições comuns de UTF-8 lido como Windows-1252/Latin-1
const replacements = [
  ["Ã¡", "á"],
  ["Ã à", "à"],
  ["Ã ", "à"],
  ["Ã¢", "â"],
  ["Ã£", "ã"],
  ["Ã¤", "ä"],
  ["Ã©", "é"],
  ["Ãª", "ê"],
  ["Ã", "í"],
  ["Ã³", "ó"],
  ["Ã´", "ô"],
  ["Ãµ", "õ"],
  ["Ãº", "ú"],
  ["Ã§", "ç"],

  ["Ã", "Á"],
  ["Ã€", "À"],
  ["Ã‚", "Â"],
  ["Ãƒ", "Ã"],
  ["Ã‰", "É"],
  ["ÃŠ", "Ê"],
  ["Ã", "Í"],
  ["Ã“", "Ó"],
  ["Ã”", "Ô"],
  ["Ã•", "Õ"],
  ["Ãš", "Ú"],
  ["Ã‡", "Ç"],

  ["Âº", "º"],
  ["Âª", "ª"],
  ["Â°", "°"],

  ["â€¢", "•"],
  ["â€”", "—"],
  ["â€“", "–"],
  ["â†’", "→"],
  ["âœ…", "✅"],
  ["âŒ", "❌"],
  ["âš¡", "⚡"],
  ["âš™ï¸", "⚙️"],
  ["ðŸš€", "🚀"],

  // Casos duplamente quebrados encontrados em App.jsx
  ["ââ‚¬Â¢", "•"],
  ["ââ‚¬”", "—"],
  ["ââ‚¬“", "–"],
  ["ââ‚¬Å“", "“"],
  ["ââ‚¬", "”"],
  ["ââ‚¬Ëœ", "‘"],
  ["ââ‚¬â„¢", "’"],
  ["ââ‚¬Â¦", "…"],

  // Blocos decorativos corrompidos
  ["â”€â”€â”€", "───"],
  ["â•â•â•", "═══"],
  ["â•", "═"],

  // Palavras e frases recorrentes
  ["veÃculo", "veículo"],
  ["PrÃ³prio", "Próprio"],
  ["AtenÃ§Ã£o", "Atenção"],
  ["ConfiguraÃ§Ã£o", "Configuração"],
  ["SincronizaÃ§Ã£o", "Sincronização"],
  ["SINCRONIZAÃ‡ÃƒO", "SINCRONIZAÇÃO"],
  ["CONCLUÃDA", "CONCLUÍDA"],
  ["CRÃTICO", "CRÍTICO"],
  ["nÃ£o", "não"],
  ["jÃ¡", "já"],
  ["vocÃª", "você"],
  ["serÃ¡", "será"],
  ["forÃ§ar", "forçar"],
  ["transferÃªncia", "transferência"],
  ["matrÃcula", "matrícula"],
  ["contrataÃ§Ã£o", "contratação"],
  ["serviÃ§os", "serviços"],
  ["ServiÃ§o", "Serviço"],
  ["VisualizaÃ§Ã£o", "Visualização"],
  ["informaÃ§Ãµes", "informações"],
  ["TÃ©rmino", "Término"],
  ["mÃ³dulo", "módulo"],
  ["indisponÃvel", "indisponível"],
  ["impressÃ£o", "impressão"],
  ["SeguranÃ§a", "Segurança"],
  ["NÂº", "Nº"]
];

for (const [bad, good] of replacements) {
  // Use a regex with the global flag to replace all occurrences
  // Escape the "bad" string for regex use
  const escapedBad = bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  s = s.replace(new RegExp(escapedBad, "g"), good);
}

fs.writeFileSync(file, s, "utf8");
console.log("Reparo de mojibake aplicado em src/App.jsx");
