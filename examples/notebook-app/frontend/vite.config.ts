import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
          '/api': {
            target: 'https://notebook.datalisk.com',
            changeOrigin: true,
          },
          '/content': {
            target: 'https://notebook.datalisk.com',
            changeOrigin: true,
          },
        },
      },
	plugins: [
		sveltekit(),
	]
});
