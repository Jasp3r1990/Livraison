@echo off
echo ========================================
echo Demarrage du systeme de simulation
echo ========================================
echo.

echo [1/2] Demarrage du backend FastAPI...
cd backend
start cmd /k "title Backend - FastAPI && python main.py"
cd ..

timeout /t 3 /nobreak > nul

echo [2/2] Demarrage du frontend React...
cd frontend
start cmd /k "title Frontend - React && npm run dev"
cd ..

echo.
echo ========================================
echo Serveurs demarres !
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo Documentation API: http://localhost:8000/docs
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul
