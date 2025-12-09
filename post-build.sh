#!/bin/bash
# Script pós-build - copia arquivos públicos e estáticos para o build standalone

# Copiar pasta public para standalone
if [ -d ".next/standalone" ] && [ -d "public" ]; then
  echo "Copiando arquivos públicos para standalone..."
  cp -r public .next/standalone/
  echo "Arquivos públicos copiados com sucesso!"
fi

# Copiar pasta .next/static para standalone (necessário para CSS, JS, etc)
if [ -d ".next/standalone" ] && [ -d ".next/static" ]; then
  echo "Copiando arquivos estáticos para standalone..."
  mkdir -p .next/standalone/.next
  cp -r .next/static .next/standalone/.next/
  echo "Arquivos estáticos copiados com sucesso!"
fi

exit 0
