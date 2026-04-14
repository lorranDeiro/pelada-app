#!/usr/bin/env node

/**
 * Script para gerar ícones PWA a partir de um SVG
 * 
 * Uso: node generate-icons.js
 * 
 * Requerimentos:
 * - npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, 'public', 'icons');
const SVG_FILE = path.join(__dirname, 'icon-template.svg');

// Verificar se o diretório existe, se não, criar
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
  console.log(`✓ Diretório criado: ${ICON_DIR}`);
}

// Verificar se o SVG existe
if (!fs.existsSync(SVG_FILE)) {
  console.error(`✗ Erro: Arquivo SVG não encontrado: ${SVG_FILE}`);
  process.exit(1);
}

// Ícones a gerar
const icons = [
  // Ícones padrão
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  
  // Ícones adaptáveis (maskable) - Android Adaptive Icons
  { name: 'maskable-192.png', size: 192, maskable: true },
  { name: 'maskable-512.png', size: 512, maskable: true },
  
  // Screenshots
  { name: 'screenshot-192.png', size: 192, maskable: false },
  { name: 'screenshot-512.png', size: 512, maskable: false },
  
  // Shortcuts
  { name: 'shortcut-novo.png', size: 192, maskable: false },
  { name: 'shortcut-ranking.png', size: 192, maskable: false },
];

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const icon of icons) {
    try {
      let buffer = await sharp(SVG_FILE)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          background: { r: 26, g: 26, b: 26 }
        });

      // Se for maskable, adicionar padding
      if (icon.maskable) {
        buffer = buffer.extend({
          top: Math.round(icon.size * 0.1),
          bottom: Math.round(icon.size * 0.1),
          left: Math.round(icon.size * 0.1),
          right: Math.round(icon.size * 0.1),
          background: { r: 26, g: 26, b: 26 }
        });
      }

      await buffer.png().toFile(path.join(ICON_DIR, icon.name));
      console.log(`✓ ${icon.name} (${icon.size}x${icon.size})`);
      successCount++;
    } catch (error) {
      console.error(`✗ Erro ao gerar ${icon.name}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✓ ${successCount} ícones gerados com sucesso`);
  if (errorCount > 0) {
    console.log(`✗ ${errorCount} erros encontrados`);
  }
  console.log(`${'='.repeat(50)}\n`);

  if (errorCount === 0) {
    console.log('🎉 Todos os ícones foram gerados!');
    console.log(`📁 Localização: ${ICON_DIR}`);
  }
}

// Rodar
generateIcons().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
