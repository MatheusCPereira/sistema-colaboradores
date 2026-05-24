@echo off
cd /d "%~dp0"

title Sistema QLP

echo.
echo  ================================================
echo   Sistema de Colaboradores QLP - IPAUSSU 2026
echo  ================================================
echo.

echo Verificando Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js: OK

echo Verificando Python...
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Python nao encontrado!
    echo Baixe em: https://www.python.org/
    pause
    exit /b 1
)
echo Python: OK

echo Verificando dependencias Python...
python -c "import pandas, openpyxl" > nul 2>&1
if %errorlevel% neq 0 (
    echo Instalando pandas e openpyxl...
    pip install pandas openpyxl --quiet
)
echo Dependencias: OK

echo.
echo Acesse:  http://localhost:3000
echo Login:   admin
echo Senha:   admin123
echo Para encerrar: feche esta janela
echo.

start /b cmd /c "timeout /t 2 /nobreak > nul && start http://localhost:3000"

node "%~dp0servidor.js"
pause
