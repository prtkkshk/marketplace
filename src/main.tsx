import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { env } from './lib/env';
import './lib/analytics';

// Startup assertion for required env variables
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
 console.error('Environment variables missing or invalid');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
 <App />
 </React.StrictMode>
);
