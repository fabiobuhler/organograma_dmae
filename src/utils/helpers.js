// --- Utilities ---

export function makeId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function initials(name) {
  if (!name) return "--";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function sortNodes(a, b) {
  if ((a.subtipo === "apoio") !== (b.subtipo === "apoio")) {
    return a.subtipo === "apoio" ? -1 : 1;
  }
  if (a.tipo !== b.tipo) return a.tipo === "estrutura" ? -1 : 1;
  return a.name.localeCompare(b.name, "pt-BR");
}

export function downloadFile(filename, text, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows) {
  const escape = (v) => {
    if (v.includes(",") || v.includes("\n") || v.includes('"')) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  return rows.map((r) => r.map(escape).join(",")).join("\n");
}

export function getDescendantIds(rootId, getChildren) {
  const result = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const c = stack.pop();
    if (!c) continue;
    result.push(c);
    getChildren(c).forEach((ch) => stack.push(ch.id));
  }
  return result;
}

export function getParentChain(id, nodeMap) {
  const chain = [];
  let cur = nodeMap.get(id);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? nodeMap.get(cur.parentId) : undefined;
  }
  return chain;
}

// ──── COLOR SYSTEM ────

/** Cor raiz padrão quando nenhuma cor é definida */
export const DEFAULT_ROOT_COLOR = "#1e40af";

/**
 * Normaliza um valor hex para formato #rrggbb minúsculo.
 * Retorna "" se inválido.
 */
export function normalizeHex(hex) {
  if (!hex || typeof hex !== "string") return "";
  const value = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toLowerCase();
  }
  return "";
}

/**
 * Converte hex para { r, g, b }
 */
export function hexToRgb(hex) {
  const h = normalizeHex(hex) || DEFAULT_ROOT_COLOR;
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

/**
 * Converte { r, g, b } para hex
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Clareia uma cor hex por percent% (0-100).
 * 5% = levemente mais claro, 80% = muito claro (para fundo de card).
 */
export function lightenHex(hex, percent = 5) {
  const { r, g, b } = hexToRgb(hex);
  const p = Math.max(0, Math.min(100, percent)) / 100;
  return rgbToHex(r + (255 - r) * p, g + (255 - g) * p, b + (255 - b) * p);
}

/**
 * Escurece uma cor hex por percent%.
 */
export function darkenHex(hex, percent = 5) {
  const { r, g, b } = hexToRgb(hex);
  const p = Math.max(0, Math.min(100, percent)) / 100;
  return rgbToHex(r * (1 - p), g * (1 - p), b * (1 - p));
}

/**
 * Retorna o percentual de clareamento por nível.
 * Subordinada: 12%, Apoio: 18%.
 * Com bg=15%, cada nível acumula diferença visível.
 */
export function getFadePercent(node) {
  if (node?.subtipo === "apoio" || node?.natureza === "apoio" || node?.tipoApoio === true) {
    return 18;
  }
  return 12;
}

/**
 * Verifica se uma cor é escura (para determinar cor do texto).
 */
export function isColorDark(hex) {
  if (!hex || hex.length < 7) return false;
  const { r, g, b } = hexToRgb(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
}

/**
 * Computa a cor efetiva de um nó baseado em sua cor própria ou herança do pai.
 * - Se o nó tem `color` própria definida, ela é a cor base.
 * - Senão, herda a cor do pai clareada (5% subordinada, 10% apoio).
 * 
 * Retorna { bg, hex, baseHex, isDark }
 * - bg: cor de fundo do card (muito clara)
 * - hex: cor da borda/conector
 * - baseHex: cor base para passar aos filhos
 * - isDark: se a cor base é escura
 */
export function computeNodeColor(node, parentHex) {
  // Lê color (canônico) com fallback para cor (legado)
  const ownColor = normalizeHex(node.color || node.cor || "");

  let baseHex;
  if (ownColor) {
    // Nó tem cor própria — usa diretamente
    baseHex = ownColor;
  } else if (parentHex) {
    // Herda do pai com clareamento
    baseHex = lightenHex(parentHex, getFadePercent(node));
  } else {
    // Sem pai nem cor própria — usa cor raiz padrão
    baseHex = DEFAULT_ROOT_COLOR;
  }

  // Fundo do card: clareado apenas 15% acima do baseHex.
  // Menos clareamento = diferença de 12%/nível fica visível entre hierarquias.
  const bg = lightenHex(baseHex, 15);


  return {
    bg,
    hex: baseHex,       // passa para os filhos como parentHex
    baseHex,            // alias para clareza
    isDark: isColorDark(baseHex),
  };
}

/**
 * Cor do conector/linha entre nós.
 * Usa a cor base com leve transparência/saturação reduzida.
 */
export function connectorColor(parentHex) {
  if (!parentHex) return "#94a3b8";
  return lightenHex(parentHex, 20); // 20% mais claro que a cor base
}

/**
 * Converte arquivo de imagem para base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error("No file")); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Legado - mantido para compatibilidade
export function hexToHsl(hex) {
  if (!hex || hex.length < 7) return { h: 220, s: 70, l: 55 };
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}


