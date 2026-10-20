import {defineConfig} from 'vite';
export default defineConfig({build:{rollupOptions:{output:{manualChunks:{three:['three'],gltf:['three/addons/loaders/GLTFLoader.js']}}}}});
