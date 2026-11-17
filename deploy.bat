@echo off
chcp 65001 > nul
echo ==========================================
echo   Despliegue SAS VetBol a la Nube
echo ==========================================
echo.
npm run deploy
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Hubo un problema durante el despliegue.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo ==========================================
echo   Despliegue finalizado con exito.
echo ==========================================
