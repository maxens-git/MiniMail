import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		proxy:
			command === 'serve'
				? {
						'/api': {
							target: 'http://localhost:3000',
							changeOrigin: true
						}
				  }
				: undefined
	}
}));
