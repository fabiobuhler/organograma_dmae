const fs = require('fs');

const originalOld = fs.readFileSync('src/backup_layout/seedData_stable.js', 'utf8');
const newNodesJS = fs.readFileSync('src/data/seedData2.js', 'utf8');

const seedNodesMatch = originalOld.indexOf('export const seedNodes = [');
const endOfSeedNodesMatch = originalOld.indexOf('export const seedAssets = [');

if (seedNodesMatch === -1 || endOfSeedNodesMatch === -1) {
    console.error("Could not find boundaries!");
    process.exit(1);
}

const beforeNodes = originalOld.substring(0, seedNodesMatch);
const afterNodes = originalOld.substring(endOfSeedNodesMatch); // this includes 'export const seedAssets'

const parsedNodesText = newNodesJS.split('export const seedNodes = ')[1].split(';\nexport const seedAssets')[0];

const finalJS = beforeNodes + 'export const seedNodes = ' + parsedNodesText + ';\n\n// --- SEED ASSETS ---\n' + afterNodes;

fs.writeFileSync('src/data/seedData.js', finalJS, 'utf8');
console.log('Rebuilt seedData.js with ALL exports successfully.');
