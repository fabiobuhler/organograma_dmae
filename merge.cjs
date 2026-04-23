// merge.cjs — merges update.json nodes into seedData.js seedNodes
const fs = require('fs');
const path = require('path');

const updatePath = path.join(__dirname, 'update.json');
const seedPath = path.join(__dirname, 'src', 'data', 'seedData.js');

const update = JSON.parse(fs.readFileSync(updatePath, 'utf8'));
const updateMap = new Map(update.nodes.map(n => [n.id, n]));

let seed = fs.readFileSync(seedPath, 'utf8');

// Extract the seedNodes array text
const startMarker = '// --- SEED NODES ---\nexport const seedNodes = [';
const startIdx = seed.indexOf(startMarker);
if (startIdx === -1) { console.error('seedNodes marker not found'); process.exit(1); }

// Find the matching closing bracket for seedNodes
let depth = 0, inStr = false, strChar = '', i = startIdx + startMarker.length - 1;
while (i < seed.length) {
  const c = seed[i];
  if (inStr) {
    if (c === strChar && seed[i-1] !== '\\') inStr = false;
  } else {
    if (c === '"' || c === "'") { inStr = true; strChar = c; }
    else if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) break; }
  }
  i++;
}
const endIdx = i; // index of closing ]

const nodesText = seed.slice(startIdx + startMarker.length - 1, endIdx + 1);

// Parse existing nodes by extracting each object
function extractObjects(text) {
  const objects = [];
  let d = 0, inS = false, sC = '', start = -1;
  for (let j = 0; j < text.length; j++) {
    const c = text[j];
    if (inS) {
      if (c === sC && text[j-1] !== '\\') inS = false;
    } else {
      if (c === '"' || c === "'") { inS = true; sC = c; }
      else if (c === '{') { if (d === 0) start = j; d++; }
      else if (c === '}') {
        d--;
        if (d === 0 && start !== -1) {
          objects.push(text.slice(start, j + 1));
          start = -1;
        }
      }
    }
  }
  return objects;
}

const existingObjStrings = extractObjects(nodesText);
const mergedObjStrings = existingObjStrings.map(objStr => {
  try {
    const obj = JSON.parse(objStr);
    if (updateMap.has(obj.id)) {
      const updated = updateMap.get(obj.id);
      updateMap.delete(obj.id); // mark as processed
      return JSON.stringify(updated, null, 4).replace(/^/gm, '  ');
    }
    return objStr;
  } catch {
    return objStr;
  }
});

// Add any nodes from update that weren't in seed yet
for (const [id, node] of updateMap) {
  console.log(`  + Adding new node: ${id} (${node.name})`);
  mergedObjStrings.push(JSON.stringify(node, null, 4).replace(/^/gm, '  '));
}

const newNodesArrayText = `[\n${mergedObjStrings.join(',\n')}\n]`;
const newSeed = seed.slice(0, startIdx + startMarker.length - 1) + newNodesArrayText + seed.slice(endIdx + 1);

fs.writeFileSync(seedPath, newSeed, 'utf8');
console.log(`Done. Merged ${update.nodes.length} nodes into seedData.js.`);
