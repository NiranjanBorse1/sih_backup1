# Stop Hyperledger Fabric Network for Tourist Safety System (Windows)

param(
    [switch]$CleanAll = $false,
    [switch]$Verbose = $false
)

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output (Windows compatible)
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }

Write-Host "🛑 Stopping Tourist Safety Blockchain Network (Windows)..." -ForegroundColor Yellow
Write-Host ""

try {
    Write-Warning "1. Checking Docker availability..."
    
    # Check if Docker is running
    try {
        docker version | Out-Null
        Write-Success "Docker is available"
    } catch {
        Write-Warning "Docker is not running. Network may already be stopped."
    }

    Write-Warning "2. Stopping Docker containers..."
    
    # Stop and remove containers
    docker-compose -f docker-compose.yaml down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Main containers stopped successfully"
    } else {
        Write-Warning "Some containers may have already been stopped"
    }

    Write-Warning "3. Cleaning up chaincode containers..."
    
    # Remove chaincode containers
    $chaincodeContainers = docker ps -aq --filter "name=dev-peer*" 2>$null
    if ($chaincodeContainers) {
        Write-Info "Found chaincode containers, removing..."
        docker rm -f $chaincodeContainers 2>$null
        Write-Success "Chaincode containers removed"
    } else {
        Write-Info "No chaincode containers found"
    }

    # Remove chaincode images
    $chaincodeImages = docker images -q --filter "reference=dev-peer*" 2>$null
    if ($chaincodeImages) {
        Write-Info "Found chaincode images, removing..."
        docker rmi -f $chaincodeImages 2>$null
        Write-Success "Chaincode images removed"
    } else {
        Write-Info "No chaincode images found"
    }

    if ($CleanAll) {
        Write-Warning "4. Performing deep cleanup (volumes and networks)..."
        
        # Remove volumes
        docker-compose -f docker-compose.yaml down -v 2>$null
        
        # Remove tourist-safety network if it exists
        $networkExists = docker network ls --filter "name=tourist-safety" --format "{{.Name}}" 2>$null
        if ($networkExists -eq "tourist-safety") {
            docker network rm tourist-safety 2>$null
            Write-Success "Removed tourist-safety network"
        }
        
        # Clean up any remaining volumes related to the project
        $projectVolumes = docker volume ls --filter "name=tourist-safety" --format "{{.Name}}" 2>$null
        if ($projectVolumes) {
            docker volume rm $projectVolumes 2>$null
            Write-Success "Removed project volumes"
        }
        
        Write-Success "Deep cleanup completed"
    }

    Write-Warning "5. Verifying cleanup..."
    
    # Check if any related containers are still running
    $remainingContainers = docker ps --filter "label=com.docker.compose.project=tourist-safety" --format "{{.Names}}" 2>$null
    if ($remainingContainers) {
        Write-Warning "Some containers are still running:"
        Write-Host $remainingContainers -ForegroundColor Yellow
    } else {
        Write-Success "All project containers stopped"
    }

    Write-Success "Network stopped successfully!"
    Write-Host ""
    Write-Info "Network cleanup completed. You can now:"
    Write-Host "  - Restart with: npm run network:up" -ForegroundColor White
    Write-Host "  - Start API only: npm start (uses demo mode)" -ForegroundColor White
    Write-Host "  - Run demo: npm run demo" -ForegroundColor White
    Write-Host ""
    
    if (!$CleanAll) {
        Write-Info "For complete cleanup including volumes, run:"
        Write-Host "  .\stop-network.ps1 -CleanAll" -ForegroundColor White
    }

} catch {
    Write-Error "Error during cleanup: $($_.Exception.Message)"
    Write-Host ""
    Write-Warning "Manual cleanup commands:"
    Write-Host "  docker-compose -f docker-compose.yaml down -v" -ForegroundColor White
    Write-Host "  docker system prune -f" -ForegroundColor White
    Write-Host "  docker volume prune -f" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Success "Cleanup completed successfully! 🎉"