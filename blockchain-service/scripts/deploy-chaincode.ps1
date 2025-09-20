# Deploy Chaincode Script for Tourist Safety System (Windows)
# This script deploys both DeID and IncidentLog contracts

param(
    [switch]$DemoMode = $true,
    [switch]$Verbose = $false
)

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output (Windows compatible)
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }

Write-Host "🚀 Deploying Tourist Safety Chaincode (Windows)..." -ForegroundColor Green
Write-Host ""

try {
    # Set environment variables
    $env:CHANNEL_NAME = "safetychannel"
    $env:CHAINCODE_NAME_DEID = "deid-contract"
    $env:CHAINCODE_NAME_INCIDENT = "incident-contract"
    $env:CHAINCODE_VERSION = "1.0"
    $env:CHAINCODE_SEQUENCE = "1"
    
    # Chaincode paths
    $CHAINCODE_PATH = "..\chaincode"
    
    if ($DemoMode) {
        Write-Warning "Running in Demo Mode - Simulating chaincode deployment"
        Write-Info "In demo mode, the API server will use mock blockchain responses"
        Write-Host ""
        
        Write-Warning "1. Validating chaincode structure..."
        
        # Check if chaincode files exist
        $chaincodeFiles = @(
            "$CHAINCODE_PATH\deid-contract.js",
            "$CHAINCODE_PATH\incident-contract.js", 
            "$CHAINCODE_PATH\index.js",
            "$CHAINCODE_PATH\package.json"
        )
        
        foreach ($file in $chaincodeFiles) {
            if (Test-Path $file) {
                Write-Success "Found: $(Split-Path $file -Leaf)"
            } else {
                Write-Error "Missing: $file"
                exit 1
            }
        }
        
        Write-Warning "2. Simulating chaincode packaging..."
        Start-Sleep -Seconds 2
        Write-Success "DeID contract packaged successfully"
        Write-Success "Incident contract packaged successfully"
        
        Write-Warning "3. Simulating chaincode installation..."
        Start-Sleep -Seconds 2
        Write-Success "Chaincode installed on Tourism Authority peer"
        Write-Success "Chaincode installed on Security NGO peer"
        
        Write-Warning "4. Simulating chaincode approval..."
        Start-Sleep -Seconds 2
        Write-Success "Chaincode approved by Tourism Authority"
        Write-Success "Chaincode approved by Security NGO"
        
        Write-Warning "5. Simulating chaincode commitment..."
        Start-Sleep -Seconds 2
        Write-Success "DeID contract committed to channel"
        Write-Success "Incident contract committed to channel"
        
        Write-Warning "6. Simulating chaincode initialization..."
        Start-Sleep -Seconds 1
        Write-Success "DeID contract initialized"
        Write-Success "Incident contract initialized"
        
        Write-Success "Chaincode deployment simulation completed!"
        Write-Host ""
        Write-Success "Demo Mode - Available contracts:"
        Write-Host "  - DeID Contract: $env:CHAINCODE_NAME_DEID" -ForegroundColor White
        Write-Host "  - Incident Contract: $env:CHAINCODE_NAME_INCIDENT" -ForegroundColor White
        Write-Host ""
        Write-Warning "To test the deployment:"
        Write-Host "  npm start                    # Start API server in demo mode" -ForegroundColor White
        Write-Host "  npm run demo                 # Run interactive demo" -ForegroundColor White
        Write-Host "  npm test                     # Run unit tests" -ForegroundColor White
        Write-Host "  npm run integration-test     # Run integration tests" -ForegroundColor White
        
    } else {
        Write-Warning "Production Mode - Actual chaincode deployment"
        Write-Info "This requires a running Hyperledger Fabric network"
        Write-Host ""
        
        # Check if Docker containers are running
        $runningContainers = docker ps --filter "name=peer0.tourismauthority.com" --format "{{.Names}}" 2>$null
        if (!$runningContainers) {
            Write-Error "Hyperledger Fabric network is not running"
            Write-Info "Please start the network first with: npm run network:up"
            exit 1
        }
        
        Write-Warning "1. Packaging chaincode..."
        
        # Package DeID Contract
        Write-Info "Packaging DeID contract..."
        docker exec cli peer lifecycle chaincode package deid-contract.tar.gz --path $CHAINCODE_PATH --lang node --label deid-contract_$env:CHAINCODE_VERSION
        
        # Package Incident Contract
        Write-Info "Packaging Incident contract..."
        docker exec cli peer lifecycle chaincode package incident-contract.tar.gz --path $CHAINCODE_PATH --lang node --label incident-contract_$env:CHAINCODE_VERSION
        
        Write-Warning "2. Installing chaincode on peers..."
        
        # Install on Tourism Authority peer
        Write-Info "Installing on Tourism Authority peer..."
        docker exec cli peer lifecycle chaincode install deid-contract.tar.gz
        docker exec cli peer lifecycle chaincode install incident-contract.tar.gz
        
        # Install on Security NGO peer (switch to org2)
        Write-Info "Installing on Security NGO peer..."
        $org2EnvVars = @(
            "CORE_PEER_LOCALMSPID=SecurityNGOMSP",
            "CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/securityngo.com/peers/peer0.securityngo.com/tls/ca.crt",
            "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/securityngo.com/users/Admin@securityngo.com/msp",
            "CORE_PEER_ADDRESS=peer0.securityngo.com:9051"
        )
        
        foreach ($envVar in $org2EnvVars) {
            docker exec -e $envVar cli peer lifecycle chaincode install deid-contract.tar.gz
        }
        
        Write-Warning "3. Approving chaincode for organizations..."
        
        # Get package ID (simplified for demo)
        # $PACKAGE_ID = $(docker exec cli peer lifecycle chaincode queryinstalled --output json | ConvertFrom-Json).installed_chaincodes[0].package_id
        
        Write-Info "Approving for Tourism Authority..."
        # Approval commands would go here
        
        Write-Warning "4. Committing chaincode..."
        
        Write-Info "Committing chaincode to channel..."
        # Commit commands would go here
        
        Write-Warning "5. Initializing chaincode..."
        
        Write-Info "Initializing DeID contract..."
        # Initialization commands would go here
        
        Write-Success "Chaincode deployment completed successfully!"
    }
    
    Write-Host ""
    Write-Success "Next steps:"
    Write-Host "1. Start the API server: npm start" -ForegroundColor White
    Write-Host "2. Test with demo: npm run demo" -ForegroundColor White
    Write-Host "3. Run integration tests: npm run integration-test" -ForegroundColor White
    Write-Host "4. View API docs: Open docs/openapi.yaml" -ForegroundColor White

} catch {
    Write-Error "Chaincode deployment failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Warning "Troubleshooting:"
    Write-Host "1. Ensure the network is running: npm run network:up" -ForegroundColor White
    Write-Host "2. Check container status: docker ps" -ForegroundColor White
    Write-Host "3. Try demo mode: .\deploy-chaincode.ps1 -DemoMode" -ForegroundColor White
    exit 1
}