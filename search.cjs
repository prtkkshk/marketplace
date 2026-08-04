const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchFiles(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('max-w-')) {
                console.log(fullPath);
            }
        }
    });
}
searchFiles('C:/Users/prtkk/Desktop/kgp_marketplace/src');
