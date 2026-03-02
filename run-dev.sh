#!/bin/bash

# Script para executar Widget e Admin simultaneamente

echo "🚀 Iniciando CEDSIF Chatbot - Desenvolvimento"
echo ""
echo "Widget:  http://localhost:4200"
echo "Admin:   http://localhost:4201"
echo ""
echo "Pressione Ctrl+C para parar todos os servidores"
echo ""

# Executar ambos os projetos em paralelo
npx concurrently \
  --names "WIDGET,ADMIN" \
  --prefix-colors "cyan,magenta" \
  "ng serve chatbot-widget --port 4200" \
  "ng serve chatbot-admin --port 4201"
