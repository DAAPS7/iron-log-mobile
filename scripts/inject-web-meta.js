/**
 * Pós-processamento do build de web.
 *
 * O `expo export -p web` (sem expo-router) não tem forma direta de
 * personalizar o index.html gerado — não há um "app/+html.js" a usar,
 * essa funcionalidade só existe com o expo-router instalado. Em vez disso,
 * copiamos os ícones para dist/ e injetamos as tags que faltam depois da
 * exportação.
 *
 * Corre automaticamente a seguir a `expo export -p web` via `npm run build:web`.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const assetsDir = path.join(__dirname, '..', 'assets');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html não encontrado — corre primeiro "expo export -p web".');
  process.exit(1);
}

// Copia o ícone para dentro de dist/, para o link relativo funcionar em produção.
fs.copyFileSync(
  path.join(assetsDir, 'apple-touch-icon.png'),
  path.join(distDir, 'apple-touch-icon.png'),
);

const extraTags = [
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="Iron Log" />',
  '<meta name="theme-color" content="#14171b" />',
].join('\n  ');

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('apple-touch-icon')) {
  console.log('apple-touch-icon já presente em dist/index.html — nada a fazer.');
} else {
  html = html.replace('</head>', `  ${extraTags}\n</head>`);
  fs.writeFileSync(indexPath, html);
  console.log('apple-touch-icon e meta tags injetadas em dist/index.html.');
}
