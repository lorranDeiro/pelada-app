# 🎨 Guia: Gerar Ícones PWA

Este guia mostra como gerar todos os ícones necessários para a aplicação PWA.

---

## **✅ O que foi criado**

- ✓ `icon-template.svg` — Arquivo SVG base (bola de futebol com design moderno)
- ✓ `generate-icons.js` — Script Node.js que converte SVG em PNG
- ✓ `package.json` — Atualizado com script `generate-icons` e `sharp`

---

## **🚀 Passo A Passo**

### **Passo 1: Instalar dependências**

```bash
npm install
```

Isso instala o `sharp` (biblioteca para processar imagens).

---

### **Passo 2: Gerar os ícones**

Execute o script gerador:

```bash
npm run generate-icons
```

**Esperado:**
```
🎨 Gerando ícones PWA...

✓ icon-192.png (192x192)
✓ icon-512.png (512x512)
✓ maskable-192.png (192x192)
✓ maskable-512.png (512x512)
✓ screenshot-192.png (192x192)
✓ screenshot-512.png (512x512)
✓ shortcut-novo.png (192x192)
✓ shortcut-ranking.png (192x192)

==================================================
✓ 8 ícones gerados com sucesso
==================================================

🎉 Todos os ícones foram gerados!
📁 Localização: .../public/icons
```

---

### **Passo 3: Verificar**

Verifique se os ícones foram criados:

```bash
ls public/icons/
# Ou no Windows Explorer: public\icons\
```

Deve aparecer:
- icon-192.png
- icon-512.png
- maskable-192.png
- maskable-512.png
- screenshot-192.png
- screenshot-512.png
- shortcut-novo.png
- shortcut-ranking.png

---

## **🎯 Customizar o ícone (Opcional)**

Se quiser mudar o design do ícone:

1. Abra `icon-template.svg` em um editor (VSCode, Inkscape, etc.)
2. Modifique as cores, formas, etc.
3. Salve o arquivo
4. Execute novamente: `npm run generate-icons`

**Dicas:**
- Cores: altere `#22c55e` (verde) para outra cor
- Formas: edite os `<circle>`, `<polygon>`, `<text>` do SVG
- Fundo: altere `#1a1a1a` (preto) para outra cor de fundo

---

## **📦 Ícones Gerados: O que cada um faz**

| Ícone | Tamanho | Uso |
|-------|--------|-----|
| **icon-192.png** | 192×192 | Ícone padrão (navegadores) |
| **icon-512.png** | 512×512 | Ícone grande (splash screen) |
| **maskable-192.png** | 192×192 | Android Adaptive Icon (pequeno) |
| **maskable-512.png** | 512×512 | Android Adaptive Icon (grande) |
| **screenshot-192.png** | 192×192 | Preview da app na loja |
| **screenshot-512.png** | 512×512 | Preview grande |
| **shortcut-novo.png** | 192×192 | Atalho "Nova Partida" |
| **shortcut-ranking.png** | 192×192 | Atalho "Ver Ranking" |

---

## **🛠️ Troubleshooting**

### **"Erro: sharp não encontrado"**
```bash
npm install sharp
```

### **"Erro: icon-template.svg não encontrado"**
- Verifique se `icon-template.svg` está na raiz do projeto
- Caminho correto: `pelada-app/icon-template.svg`

### **"Ícones gerados mas com baixa qualidade"**
- Aumente o tamanho no SVG (atualmente 192x192)
- Ou aumente o `font-size` e `r` (raio) dos elementos SVG

### **"Quero usar meu próprio logo"**
1. Salve seu logo como SVG em: `icon-template.svg`
2. Certifique-se de que o SVG tem viewBox: `viewBox="0 0 192 192"`
3. Execute: `npm run generate-icons`

---

## **✨ Próximo Passo**

Após gerar os ícones:

1. Commit e push:
   ```bash
   git add public/icons/ package.json
   git commit -m "feat: generate PWA icons"
   git push
   ```

2. Teste no celular:
   - Abra em navegador móvel
   - Clique em "Instalar"
   - Ícone aparece na home! 🎉

---

## **📚 Referências**

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [SVG Spec](https://www.w3.org/TR/SVG2/)
- [Web App Manifest Icons](https://www.w3.org/TR/appmanifest/#icons-member)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_application_style)

---

Dúvidas? É só chamar! 🚀
