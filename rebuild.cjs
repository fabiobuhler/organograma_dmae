const fs = require('fs');

const originalOld = fs.readFileSync('src/backup_layout/seedData_stable.js', 'utf8');
const newNodesJS = fs.readFileSync('src/data/seedData2.js', 'utf8');

// The original file has:
// export const seedPersons = [...];
// export const seedAssets = [...];
// export const seedContracts = [...];
// export const seedNodes = [...];
// We just want to extract everything EXCEPT seedNodes.

// Find where seedNodes starts in the original file
const seedNodesMatch = originalOld.indexOf('export const seedNodes = [');

if (seedNodesMatch === -1) {
    console.error("Could not find seedNodes in original string!");
    process.exit(1);
}

// Split the new JS to just get the array 
const parsedNodesText = newNodesJS.split('export const seedNodes = ')[1].split(';\nexport const seedAssets')[0];

const finalJS = originalOld.substring(0, seedNodesMatch) + '\nexport const seedNodes = ' + parsedNodesText + ';\n';

fs.writeFileSync('src/data/seedData.js', finalJS, 'utf8');
console.log('Rebuilt seedData.js successfully.');
