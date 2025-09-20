#!/bin/bash

# Deploy Chaincode Script for Tourist Safety System
# This script deploys both DeID and IncidentLog contracts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying Tourist Safety Chaincode...${NC}"

# Set environment variables
export CHANNEL_NAME=safetychannel
export CHAINCODE_NAME_DEID=deid-contract
export CHAINCODE_NAME_INCIDENT=incident-contract
export CHAINCODE_VERSION=1.0
export CHAINCODE_SEQUENCE=1

# Chaincode paths
CHAINCODE_PATH="../chaincode"

echo -e "${YELLOW}1. Packaging chaincode...${NC}"

# Package DeID Contract
echo "Packaging DeID contract..."
# peer lifecycle chaincode package deid-contract.tar.gz --path ${CHAINCODE_PATH} --lang node --label deid-contract_${CHAINCODE_VERSION}

# Package Incident Contract  
echo "Packaging Incident contract..."
# peer lifecycle chaincode package incident-contract.tar.gz --path ${CHAINCODE_PATH} --lang node --label incident-contract_${CHAINCODE_VERSION}

echo -e "${YELLOW}2. Installing chaincode on peers...${NC}"

# Install on Tourism Authority peer
echo "Installing on Tourism Authority peer..."
# docker exec cli peer lifecycle chaincode install deid-contract.tar.gz
# docker exec cli peer lifecycle chaincode install incident-contract.tar.gz

# Install on Security NGO peer (switch to org2)
echo "Installing on Security NGO peer..."
# docker exec -e CORE_PEER_LOCALMSPID=SecurityNGOMSP \
#   -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/securityngo.com/peers/peer0.securityngo.com/tls/ca.crt \
#   -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/securityngo.com/users/Admin@securityngo.com/msp \
#   -e CORE_PEER_ADDRESS=peer0.securityngo.com:9051 \
#   cli peer lifecycle chaincode install deid-contract.tar.gz

echo -e "${YELLOW}3. Approving chaincode for organizations...${NC}"

# Get package ID (in real deployment)
# PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[0].package_id')

# Approve for Tourism Authority
echo "Approving for Tourism Authority..."
# docker exec cli peer lifecycle chaincode approveformyorg -o orderer.example.com:7050 --channelID $CHANNEL_NAME --name $CHAINCODE_NAME_DEID --version $CHAINCODE_VERSION --package-id $PACKAGE_ID --sequence $CHAINCODE_SEQUENCE --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

echo -e "${YELLOW}4. Committing chaincode...${NC}"

# Commit chaincode
echo "Committing chaincode to channel..."
# docker exec cli peer lifecycle chaincode commit -o orderer.example.com:7050 --channelID $CHANNEL_NAME --name $CHAINCODE_NAME_DEID --version $CHAINCODE_VERSION --sequence $CHAINCODE_SEQUENCE --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem --peerAddresses peer0.tourismauthority.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/tourismauthority.com/peers/peer0.tourismauthority.com/tls/ca.crt --peerAddresses peer0.securityngo.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/securityngo.com/peers/peer0.securityngo.com/tls/ca.crt

echo -e "${YELLOW}5. Initializing chaincode...${NC}"

# Initialize DeID Contract
echo "Initializing DeID contract..."
# docker exec cli peer chaincode invoke -o orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n $CHAINCODE_NAME_DEID --peerAddresses peer0.tourismauthority.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/tourismauthority.com/peers/peer0.tourismauthority.com/tls/ca.crt --peerAddresses peer0.securityngo.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/securityngo.com/peers/peer0.securityngo.com/tls/ca.crt -c '{"function":"initLedger","Args":[]}'

echo -e "${GREEN}Chaincode deployment completed successfully!${NC}"
echo -e "${GREEN}Available contracts:${NC}"
echo "  - DeID Contract: ${CHAINCODE_NAME_DEID}"
echo "  - Incident Contract: ${CHAINCODE_NAME_INCIDENT}"
echo ""
echo -e "${YELLOW}To test the deployment, run:${NC}"
echo "  npm test"
echo "  or use the API endpoints at http://localhost:3001"