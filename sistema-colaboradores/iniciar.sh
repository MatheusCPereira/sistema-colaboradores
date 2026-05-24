#!/bin/bash
echo ""
echo " ╔══════════════════════════════════════════════╗"
echo " ║   Sistema de Colaboradores QLP — IPAUSSU    ║"
echo " ╚══════════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo " [ERRO] Node.js não encontrado!"
    echo " Baixe em: https://nodejs.org/"
    exit 1
fi

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo " [ERRO] Python3 não encontrado!"
    exit 1
fi

# Verificar dependências Python
python3 -c "import pandas, openpyxl" 2>/dev/null || {
    echo " Instalando dependências Python..."
    pip3 install pandas openpyxl --quiet
}

echo " Servidor iniciando em http://localhost:3000"
echo " Login: admin / Senha: admin123"
echo " [Ctrl+C para encerrar]"
echo ""

# Abrir navegador (tenta macOS, depois Linux)
(sleep 2 && (open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null)) &

node servidor.js
