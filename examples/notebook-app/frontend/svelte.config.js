import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
        adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
        prerender: {
            // use relative URLs similar to an anchor tag <a href="/test/1"></a>
            // do not include group layout folders in the path such as /(group)/test/1
            entries: ['/n/0', '/404.html']
        },
        paths: {
            relative: false, // otherwise 404.html won't render correctly
        }
	}
};

export default config;
