export default {
    root: './src', 
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    server: {
    proxy: {
        '/music': {
        target: 'https://cdn.jkcoder.eu',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/music/, '/music'),
        }
    }
    }
}
  