@echo off
setlocal
cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo Project virtual environment was not found.
    echo Create it with: py -m venv venv
    echo Then install packages with: venv\Scripts\python -m pip install -r requirements.txt
    pause
    exit /b 1
)

"venv\Scripts\python.exe" -m streamlit run "%~dp0app.py"
pause
