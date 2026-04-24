const fs = require('fs');
const path = require('path');

const newVer = '1.0.2026.04241700';
const versionRegex = /1\.0\.2026\.\d{8}/g; // Catching at least the date part, but let's be more specific
const fullVersionRegex = /1\.0\.2026\.\d+/g;

const files = [
    'src/App.jsx',
    'README.md',
    'README.txt',
    'GOVERNANCE.md'
];

files.forEach(f => {
    const filePath = path.join(process.cwd(), f);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (fullVersionRegex.test(content)) {
            content = content.replace(fullVersionRegex, newVer);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${f}`);
        } else {
            console.log(`Version pattern not found in ${f}`);
        }
    } else {
        console.log(`File ${f} not found`);
    }
});
