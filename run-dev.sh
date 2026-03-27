#!/bin/bash

# Script para executar Widget, Admin e User Chat simultaneamente

echo "🚀 Iniciando CEDSIF Chatbot - Desenvolvimento"
echo ""
echo "Widget:  http://localhost:4200"
echo "Admin:   http://localhost:4201"
echo "User:    http://localhost:4202"
echo ""
echo "Pressione Ctrl+C para parar todos os servidores"
echo ""

# Executar todos os projetos em paralelo
npx concurrently \
  --names "WIDGET,ADMIN,USER" \
  --prefix-colors "cyan,magenta,green" \
  "ng serve chatbot-widget --port 4200" \
  "ng serve chatbot-admin --port 4201" \
  "ng serve chatbot-user --port 4202"
