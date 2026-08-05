import { loadConfigFromFile } from 'vite'; loadConfigFromFile({command: 'serve', mode: 'development'}, 'vite.config.ts').then(console.log).catch(console.error);
