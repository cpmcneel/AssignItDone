import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import chatHandler from './api/chat.js';

const serverConfigNames = ['OLLAMA_BASE_URL', 'OLLAMA_MODEL', 'OLLAMA_API_KEY'];

function localChatApi() {
  return {
    name: 'local-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', chatHandler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/chat', chatHandler);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const name of serverConfigNames) {
    if (!process.env[name] && env[name]) process.env[name] = env[name];
  }

  return {
    plugins: [react(), localChatApi()],
  };
});