/**
 * Corre depois de `npx expo export -p web`.
 *
 * O Expo não tem, nesta versão, uma forma direta de acrescentar o
 * apple-touch-icon ao <head> gerado (isso normalmente vem com o Expo
 * Router, que não usamos aqui — navegamos com React Navigation). Em vez de
 * depender de um mecanismo interno que muda entre versões do SDK, isto
 * copia o ícone para dist/ e injeta a tag diretamente no HTML já gerado.
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ICON_SRC = path.join(__dirname, '..', 'assets', 'apple-touch-icon.png');
const ICON_DEST = path.join(DIST_DIR, 'apple-touch-icon.png');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');

const TAG = '<link rel="apple-touch-icon" href="/apple-touch-icon.png">';

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('dist/ não existe — corre "npx expo export -p web" primeiro.');
    process.exit(1);
  }
  if (!fs.existsSync(ICON_SRC)) {
    console.error('assets/apple-touch-icon.png não encontrado.');
    process.exit(1);
  }

  fs.copyFileSync(ICON_SRC, ICON_DEST);

  let html = fs.readFileSync(INDEX_HTML, 'utf8');
  if (html.includes('apple-touch-icon')) {
    console.log('apple-touch-icon já estava presente no HTML — nada a fazer.');
    return;
  }
  html = html.replace('</head>', `  ${TAG}\n  </head>`);
  fs.writeFileSync(INDEX_HTML, html);
  console.log('apple-touch-icon adicionado a dist/index.html.');
}

main();
