# Windows Setup Guide - Tourist Safety Blockchain Service

## 🪟 Windows-Specific Instructions

### Prerequisites for Windows
- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PowerShell 5.1+** (comes with Windows 10/11)
- **Docker Desktop** (optional, for full blockchain mode)
- **Git** (optional, for version control)

### Quick Setup (Recommended)

1. **Open PowerShell as Administrator** (recommended) or Command Prompt
2. **Navigate to the project directory:**
   ```cmd
   cd "C:\Users\Ashwin\Documents\Team-Visioneers\blockchain-service"
   ```

3. **Run the Windows setup script:**
   ```cmd
   setup-windows.bat
   ```
   
   This will:
   - Install all dependencies
   - Create necessary directories
   - Set up configuration files
   - Offer to start the service

### Manual Setup (Alternative)

If you prefer manual setup:

```powershell
# 1. Install dependencies
npm install

# 2. Create environment file
copy .env.example .env

# 3. Create necessary directories
mkdir config\wallet -Force
mkdir logs -Force
mkdir config\crypto-config -Force

# 4. Start the service
npm start
```

### Running the Service

#### Option 1: Demo Mode (No Docker Required)
```cmd
# Start the API server
npm start

# In another terminal, run the demo
npm run demo

# Run tests
npm test
npm run integration-test
```

#### Option 2: Full Blockchain Mode (Requires Docker)
```powershell
# Start Hyperledger Fabric network
npm run network:up

# Deploy chaincode (demo mode)
npm run deploy:chaincode

# Start API server
npm start

# Stop network when done
npm run network:down
```

### Available PowerShell Scripts

The service includes Windows-compatible PowerShell scripts:

- **`network\start-network.ps1`** - Start Hyperledger Fabric network
- **`network\stop-network.ps1`** - Stop and cleanup network
- **`scripts\deploy-chaincode.ps1`** - Deploy smart contracts

### Windows-Specific npm Scripts

```json
{
  "network:up": "powershell -ExecutionPolicy Bypass -File .\\network\\start-network.ps1",
  "network:down": "powershell -ExecutionPolicy Bypass -File .\\network\\stop-network.ps1",
  "demo": "node scripts/demo.js",
  "integration-test": "node tests/integration.js"
}
```

### Troubleshooting Windows Issues

#### PowerShell Execution Policy
If you get execution policy errors:
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Port Conflicts
If ports are in use, check what's using them:
```cmd
netstat -ano | findstr :3001
netstat -ano | findstr :7050
netstat -ano | findstr :7051
```

#### Docker Issues
- Ensure Docker Desktop is running
- Check Docker settings: Enable "Expose daemon on tcp://localhost:2375"
- Try restarting Docker Desktop

#### Node.js PATH Issues
If `node` or `npm` commands aren't recognized:
1. Reinstall Node.js with "Add to PATH" option checked
2. Restart your terminal/PowerShell
3. Verify with: `node --version` and `npm --version`

#### File Permission Issues
If you get permission errors:
- Run PowerShell as Administrator
- Ensure your user has write access to the project directory

### Testing the Installation

1. **Health Check:**
   ```cmd
   curl http://localhost:3001/health
   ```

2. **API Test:**
   ```cmd
   npm run integration-test
   ```

3. **Demo Run:**
   ```cmd
   npm run demo
   ```

### Development on Windows

#### Recommended Tools
- **VS Code** with extensions:
  - REST Client (for testing APIs)
  - Docker (if using containers)
  - PowerShell
- **Postman** (for API testing)
- **Docker Desktop** (for full blockchain mode)

#### Windows Terminal Setup
For better experience, use Windows Terminal with PowerShell:
```powershell
# Install via Microsoft Store or winget
winget install Microsoft.WindowsTerminal
```

### File Paths and Compatibility

The service handles Windows paths correctly:
- Uses `path.join()` for cross-platform path handling
- Creates directories with `{ recursive: true }`
- Supports both forward and backward slashes

### Environment Variables

Windows-specific `.env` configuration:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Windows-specific paths (use forward slashes or escaped backslashes)
NETWORK_CONFIG_PATH=./config/connection-profile.yaml
WALLET_PATH=./config/wallet
LOG_FILE=./logs/blockchain-service.log
```

### Performance on Windows

- Demo mode: Excellent performance, no Docker overhead
- Full blockchain mode: Requires adequate RAM (8GB+) for Docker
- SSD recommended for better container startup times

### Security Considerations

- Run as non-administrator user when possible
- Use Windows Defender exceptions for node_modules if needed
- Keep Docker Desktop updated for security patches

---

## 🎯 Quick Start Summary

1. Run `setup-windows.bat` 
2. Execute `npm start`
3. Test with `npm run demo`
4. Access API at `http://localhost:3001`

The service is now Windows-ready! 🚀