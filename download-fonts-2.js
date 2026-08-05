import fs from 'fs';
import path from 'path';
import https from 'https';

const fonts = [
  { name: 'instrument-serif-regular.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@latest/latin-400-normal.woff2' },
  { name: 'instrument-serif-italic.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/instrument-serif@latest/latin-400-italic.woff2' }
];

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

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
