import fs from 'fs';
import path from 'path';
import https from 'https';

const fonts = [
  { name: 'inter-400.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2' },
  { name: 'inter-500.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.woff2' },
  { name: 'inter-600.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2' },
  { name: 'inter-700.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff2' },
  { name: 'pjs-600.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-600-normal.woff2' },
  { name: 'pjs-700.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-700-normal.woff2' },
  { name: 'pjs-800.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-800-normal.woff2' }
];

const fontsDir = path.join(process.cwd(), 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

fonts.forEach(font => {
  const file = fs.createWriteStream(path.join(fontsDir, font.name));
  https.get(font.url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${font.name}`);
    });
  });
});
