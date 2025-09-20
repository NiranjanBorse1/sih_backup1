@echo off
REM Quick Setup Script for Tourist Safety Blockchain Service (Windows)
REM This script sets up and starts the blockchain service

echo.
echo 🚀 Tourist Safety Blockchain Service - Windows Setup
echo ===================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

echo ✅ npm found:
npm --version

echo.
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "config\wallet" mkdir "config\wallet"
if not exist "logs" mkdir "logs"
if not exist "config\crypto-config" mkdir "config\crypto-config"

echo ✅ Directories created
echo.

REM Copy environment file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating environment configuration...
    copy ".env.example" ".env" >nul
    echo ✅ Environment file created from template
    echo.
)

echo 🎯 Setup completed successfully!
echo.
echo 🚀 Available commands:
echo   npm start                    - Start the blockchain API server
echo   npm run demo                 - Run interactive demonstration
echo   npm test                     - Run unit tests
echo   npm run integration-test     - Run integration tests
echo   npm run network:up          - Start Hyperledger Fabric network (requires Docker)
echo   npm run network:down        - Stop Hyperledger Fabric network
echo.
echo 💡 Quick start:
echo   1. Run: npm start
echo   2. Open another terminal and run: npm run demo
echo.
echo ℹ️  The service runs in demo mode by default (no Docker required)
echo ℹ️  For full blockchain mode, ensure Docker Desktop is running first
echo.

set /p "choice=Would you like to start the API server now? (y/N): "
if /i "%choice%"=="y" (
    echo.
    echo 🚀 Starting blockchain API server...
    call npm start
) else (
    echo.
    echo 👍 Setup complete! Run 'npm start' when ready.
)

echo.
pause