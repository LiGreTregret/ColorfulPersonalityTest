import { resolve } from 'path'
import { defineConfig } from 'vite'

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, 'dist');

export default defineConfig({
	root,
    build: {
        outDir,
        rollupOptions: {
            input: {
                diagnosis: resolve(root, 'diagnosis', 'index.html'),
                result: resolve(root, 'result', 'index.html'),
            },
        },
    },
    base: '/ColorfulPersonalityTest/',
});