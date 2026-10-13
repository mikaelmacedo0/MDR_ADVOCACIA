@echo off
chcp 65001 >nul
title JurisAcompanha - Plataforma Juridica Multi-Tenant
cls
echo ========================================================
echo   JurisAcompanha - Sistema de Acompanhamento Processual
echo ========================================================
echo.
echo [1/2] Iniciando o servidor Vite local (http://localhost:5173)...
echo [2/2] Abrindo a tela de login no seu navegador padrao...
echo.
npm run dev
