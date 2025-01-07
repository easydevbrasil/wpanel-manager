#!/bin/bash

# Script para gerar ícones PWA do SVG existente
# Execute este script na pasta client/public

echo "🎨 Gerando ícones PWA para wPanel..."

# Verificar se o ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick não encontrado. Instalando..."
    
    # Detectar sistema operacional
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y imagemagick
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install imagemagick
    else
        echo "Sistema não suportado. Instale o ImageMagick manualmente."
        exit 1
    fi
fi

# Gerar ícones em diferentes tamanhos
echo "📱 Gerando ícone 192x192..."
convert -background none icon-192.svg -resize 192x192 icon-192x192.png

echo "📱 Gerando ícone 512x512..."
convert -background none icon-192.svg -resize 512x512 icon-512x512.png

echo "🍎 Gerando ícone Apple Touch (180x180)..."
convert -background none icon-192.svg -resize 180x180 apple-touch-icon.png

echo "🌐 Gerando favicon ICO..."
convert -background none icon-192.svg -resize 32x32 favicon.ico

echo "🔍 Gerando favicon PNG (32x32)..."
convert -background none icon-192.svg -resize 32x32 favicon-32x32.png

echo "🔍 Gerando favicon PNG (16x16)..."
convert -background none icon-192.svg -resize 16x16 favicon-16x16.png

# Verificar se os arquivos foram criados
echo ""
echo "✅ Ícones gerados:"
ls -la *.png *.ico 2>/dev/null | grep -E "(icon-|favicon|apple-)" || echo "❌ Nenhum ícone foi gerado"

echo ""
echo "🚀 Pronto! Os ícones PWA foram gerados com sucesso."
echo "📋 Arquivos criados:"
echo "   - icon-192x192.png (Ícone PWA pequeno)"
echo "   - icon-512x512.png (Ícone PWA grande)"  
echo "   - apple-touch-icon.png (Ícone iOS)"
echo "   - favicon.ico (Favicon principal)"
echo "   - favicon-32x32.png (Favicon grande)"
echo "   - favicon-16x16.png (Favicon pequeno)"