# 🐳 Docker Setup for Tourist Safety Blockchain

## Prerequisites Installation

### 1. Install Docker Desktop
1. **Download**: https://docs.docker.com/desktop/install/windows/
2. **Install**: Run installer as Administrator
3. **Restart**: Computer when prompted
4. **Start**: Docker Desktop application

### 2. Configure Docker Settings
Open Docker Desktop → Settings:

#### **Resources Configuration:**
- **Memory**: 8GB minimum (12GB recommended)
- **CPUs**: 4+ cores
- **Disk**: 20GB+ available space

#### **WSL2 Backend (Recommended):**
- Enable "Use WSL 2 based engine"
- Ensure WSL2 is installed: `wsl --install`

#### **Experimental Features:**
- Enable "Use containerd for pulling and storing images"

## Verify Docker Installation

After installation, test in PowerShell:

```powershell
# Check Docker version
docker --version

# Test Docker functionality
docker run hello-world

# Check Docker Compose
docker-compose --version
```

Expected output:
```
Docker version 24.0.7, build afdd53b
Docker Compose version v2.23.3-desktop.2
```

## Blockchain Network Setup

### 1. Pull Hyperledger Fabric Images
```powershell
cd "C:\Users\Ashwin\Documents\Team-Visioneers\blockchain-service"

# Pull Fabric 2.4 images
docker pull hyperledger/fabric-peer:2.4
docker pull hyperledger/fabric-orderer:2.4
docker pull hyperledger/fabric-ca:1.5
docker pull hyperledger/fabric-tools:2.4
docker pull hyperledger/fabric-ccenv:2.4
docker pull couchdb:3.3.3
```

### 2. Start the Blockchain Network
```powershell
# Start the complete network
npm run network:up

# Verify network is running
docker ps

# Check logs
docker-compose -f network/docker-compose.yaml logs
```

### 3. Deploy Smart Contracts
```powershell
# Deploy chaincode
npm run deploy:chaincode

# Verify deployment
docker logs peer0.tourism.example.com
```

### 4. Test Full Integration
```powershell
# Start API server (connects to real blockchain)
npm start

# Run integration tests
npm run integration-test

# Run demo with real blockchain
npm run demo
```

## Expected Network Components

When running `docker ps`, you should see:

| Container | Purpose | Port |
|-----------|---------|------|
| peer0.tourism.example.com | Tourism Authority Peer | 7051 |
| peer0.security.example.com | Security NGO Peer | 8051 |
| orderer.example.com | Transaction Orderer | 7050 |
| ca.tourism.example.com | Tourism CA | 7054 |
| ca.security.example.com | Security CA | 8054 |
| couchdb0 | Tourism State DB | 5984 |
| couchdb1 | Security State DB | 6984 |

## Troubleshooting

### Port Conflicts
If ports are in use:
```powershell
# Check what's using blockchain ports
netstat -ano | findstr :7050
netstat -ano | findstr :7051
netstat -ano | findstr :5984

# Stop conflicting services
Stop-Service -Name "service-name"
```

### Docker Issues
```powershell
# Restart Docker
Restart-Service docker

# Clean Docker cache
docker system prune -a

# Reset Docker network
docker network prune
```

### Fabric Network Issues
```powershell
# Stop network completely
npm run network:down

# Clean everything and restart
docker system prune -a
npm run network:up
```

### WSL2 Issues
```powershell
# Update WSL2
wsl --update

# Check WSL status
wsl --status

# Set default WSL version
wsl --set-default-version 2
```

## Performance Tuning

### For Development:
- **Memory**: 8GB minimum
- **Storage**: Use SSD for containers
- **Network**: Disable VPN if having connection issues

### For Production Testing:
- **Memory**: 16GB+ recommended
- **CPUs**: 8+ cores
- **Storage**: 50GB+ available
- **Network**: Dedicated network interface

## Security Considerations

1. **Firewall Rules**: Allow Docker ports
2. **Antivirus**: Exclude Docker directories
3. **User Permissions**: Run as non-admin when possible
4. **Network Isolation**: Use Docker networks

## Next Steps After Installation

1. ✅ Install Docker Desktop
2. ✅ Configure resources (8GB+ RAM)
3. ✅ Pull Fabric images
4. ✅ Start network: `npm run network:up`
5. ✅ Deploy contracts: `npm run deploy:chaincode`
6. ✅ Test API: `npm start`
7. ✅ Run demo: `npm run demo`

Your blockchain will then run on **real Hyperledger Fabric** instead of demo mode! 🚀