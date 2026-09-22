import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));
const backendRoot = fileURLToPath(new URL('../Backend/', import.meta.url));

export default defineConfig(({ mode }) => {
  const frontendEnv = loadEnv(mode, frontendRoot, 'API_PROXY_TARGET');
  // The local API runs in development mode independently of Vite's build mode.
  // Read only PORT; backend secrets must never become frontend variables.
  const backendEnv = loadEnv('development', backendRoot, 'PORT');
  const target = process.env.API_PROXY_TARGET || frontendEnv.API_PROXY_TARGET
    || `http://127.0.0.1:${process.env.PORT || backendEnv.PORT || 5000}`;

  return {
    plugins: [react()],
    server: { proxy: { '/api': { target } } }
  };
});
