import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { env } from './lib/env';
import { analytics } from './lib/analytics';

// Startup assertion for required env variables
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
 console.error('Environment variables missing or invalid');
}

window.addEventListener('error', (event) => {
 analytics.track('error_occurred', {
 type: 'uncaught_exception',
 message: event.message,
 stack: event.error?.stack || 'No stack trace available',
 route: window.location.pathname,
 });
});

window.addEventListener('unhandledrejection', (event) => {
 analytics.track('error_occurred', {
 type: 'unhandled_rejection',
 message: event.reason?.message || String(event.reason),
 stack: event.reason?.stack || 'No stack trace available',
 route: window.location.pathname,
 });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
 <App />
 </React.StrictMode>
);
