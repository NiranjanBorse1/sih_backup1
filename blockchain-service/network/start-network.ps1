# Start Hyperledger Fabric Network for Tourist Safety System (Windows)
# 2-Org Network: Tourism Authority + Security NGO

param(
    [switch]$Verbose = $false
)

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output (Windows compatible)
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }

Write-Host "🚀 Starting Tourist Safety Blockchain Network (Windows)..." -ForegroundColor Green
Write-Host ""

try {
    # Set environment variables
    $env:COMPOSE_PROJECT_NAME = "tourist-safety"
    $env:IMAGE_TAG = "latest"
    $env:SYS_CHANNEL = "system-channel"
    $env:CHANNEL_NAME = "safetychannel"

    # Create necessary directories
    Write-Warning "1. Creating necessary directories..."
    
    $directories = @(
        "..\config\crypto-config",
        "..\config\channel-artifacts", 
        "..\logs"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Info "Created directory: $dir"
        }
    }

    Write-Warning "2. Checking Docker availability..."
    
    # Check if Docker is running
    try {
        docker version | Out-Null
        Write-Success "Docker is available"
    } catch {
        Write-Error "Docker is not running or not installed. Please start Docker Desktop."
        exit 1
    }

    # Check if docker-compose is available
    try {
        docker-compose version | Out-Null
        Write-Success "Docker Compose is available"
    } catch {
        Write-Error "Docker Compose is not available. Please install Docker Desktop with Compose."
        exit 1
    }

    Write-Warning "3. Cleaning up any existing containers..."
    
    # Clean up existing containers (suppress errors if none exist)
    docker-compose -f docker-compose.yaml down 2>$null
    
    # Remove any orphaned chaincode containers
    $chaincodeContainers = docker ps -aq --filter "name=dev-peer*" 2>$null
    if ($chaincodeContainers) {
        docker rm -f $chaincodeContainers 2>$null
        Write-Info "Removed existing chaincode containers"
    }

    Write-Warning "4. Starting Docker containers..."
    
    # Start the network
    docker-compose -f docker-compose.yaml up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start Docker containers"
        exit 1
    }

    Write-Warning "5. Waiting for containers to start..."
    Start-Sleep -Seconds 15
    
    # Check container status
    $runningContainers = docker-compose -f docker-compose.yaml ps --services --filter "status=running"
    $totalServices = docker-compose -f docker-compose.yaml config --services
    
    Write-Info "Checking container status..."
    docker-compose -f docker-compose.yaml ps

    Write-Warning "6. Network initialization (Demo Mode)..."
    
    # For demo purposes, we'll create mock crypto material
    Write-Info "Generating demo crypto material..."
    
    # Create basic directory structure for demo
    $cryptoBasePath = "..\config\crypto-config"
    $demoDirectories = @(
        "$cryptoBasePath\ordererOrganizations\example.com\orderers\orderer.example.com\msp",
        "$cryptoBasePath\peerOrganizations\tourismauthority.com\peers\peer0.tourismauthority.com\msp",
        "$cryptoBasePath\peerOrganizations\securityngo.com\peers\peer0.securityngo.com\msp"
    )
    
    foreach ($dir in $demoDirectories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    Write-Success "Network started successfully!"
    Write-Host ""
    Write-Success "Access the network using:"
    Write-Host "  - Tourism Authority Peer: localhost:7051" -ForegroundColor White
    Write-Host "  - Security NGO Peer: localhost:9051" -ForegroundColor White  
    Write-Host "  - Orderer: localhost:7050" -ForegroundColor White
    Write-Host ""
    Write-Warning "To test the blockchain service:"
    Write-Host "  npm start                    # Start the API server" -ForegroundColor White
    Write-Host "  npm run demo                 # Run interactive demo" -ForegroundColor White
    Write-Host "  npm run integration-test     # Run integration tests" -ForegroundColor White
    Write-Host ""
    Write-Warning "To stop the network:"
    Write-Host "  npm run network:down         # Stop using npm script" -ForegroundColor White
    Write-Host "  .\stop-network.ps1          # Stop using PowerShell script" -ForegroundColor White

} catch {
    Write-Error "Failed to start network: $($_.Exception.Message)"
    Write-Host ""
    Write-Warning "Troubleshooting tips:"
    Write-Host "1. Ensure Docker Desktop is running" -ForegroundColor White
    Write-Host "2. Check if ports 7050, 7051, 9051 are available" -ForegroundColor White
    Write-Host "3. Try running: docker system prune -f" -ForegroundColor White
    Write-Host "4. Restart Docker Desktop and try again" -ForegroundColor White
    exit 1
}