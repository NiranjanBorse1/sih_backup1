#!/bin/bash

# Network Manager Script for Tourist Safety Blockchain Network
# Handles starting, stopping, and managing the Hyperledger Fabric network

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment variables and paths
export COMPOSE_PROJECT_NAME=tourist-safety
export IMAGE_TAG=latest
export SYS_CHANNEL=system-channel
export CHANNEL_NAME=safetychannel

# Set absolute paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yaml"
PEER_BASE_FILE="$SCRIPT_DIR/peer-base.yaml"

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running or not accessible${NC}"
        exit 1
    fi
}

# Function to check required images
check_images() {
    local required_images=(
        "hyperledger/fabric-ca"
        "hyperledger/fabric-tools"
        "hyperledger/fabric-peer"
        "hyperledger/fabric-orderer"
        "hyperledger/fabric-ccenv"
    )

    echo -e "${BLUE}Checking required Docker images...${NC}"
    for image in "${required_images[@]}"; do
        if ! docker images | grep -q "$image"; then
            echo -e "${YELLOW}Image $image not found locally. Pulling...${NC}"
            docker pull "$image:$IMAGE_TAG"
        fi
    done
}

# Function to clean up containers and resources
cleanup() {
    echo -e "${YELLOW}Cleaning up existing containers and resources...${NC}"
    
    # Stop and remove all fabric containers
    echo "Stopping running containers..."
    docker ps -aq --filter "name=dev-peer*" | xargs -r docker rm -f
    docker ps -aq --filter "name=peer*" | xargs -r docker rm -f
    docker ps -aq --filter "name=orderer*" | xargs -r docker rm -f
    docker ps -aq --filter "name=ca*" | xargs -r docker rm -f
    docker ps -aq --filter "name=cli" | xargs -r docker rm -f

    # Remove chaincode containers and images
    echo "Removing chaincode containers and images..."
    docker ps -aq --filter "name=dev-peer*" | xargs -r docker rm -f
    docker images -q --filter "reference=dev-peer*" | xargs -r docker rmi -f

    # Remove any other project containers
    docker-compose -f docker-compose.yaml down --volumes --remove-orphans 2>/dev/null || true
}

# Function to start the network
start_network() {
    echo -e "${GREEN}Starting Tourist Safety Blockchain Network...${NC}"
    
    # Create necessary directories
    mkdir -p ../config/crypto-config
    mkdir -p ../config/channel-artifacts
    mkdir -p ../logs

    # Start the network using docker-compose
    docker-compose -f docker-compose.yaml up -d

    # Wait for containers to be up
    echo -e "${YELLOW}Waiting for containers to start...${NC}"
    sleep 10

    echo -e "${GREEN}Network started successfully!${NC}"
    echo -e "Access points:"
    echo -e "  - Tourism Authority Peer: localhost:7051"
    echo -e "  - Security NGO Peer: localhost:9051"
    echo -e "  - Orderer: localhost:7050"
    echo -e "  - CA Tourism Authority: localhost:7054"
    echo -e "  - CA Security NGO: localhost:8054"
}

# Function to stop the network
stop_network() {
    echo -e "${YELLOW}Stopping Tourist Safety Blockchain Network...${NC}"
    cleanup
    echo -e "${GREEN}Network stopped successfully!${NC}"
}

# Function to show network status
show_status() {
    echo -e "${BLUE}Network Status:${NC}"
    echo -e "\nRunning Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "peer|orderer|ca|cli"
}

# Main script logic
case "$1" in
    "start")
        check_docker
        check_images
        start_network
        ;;
    "stop")
        check_docker
        stop_network
        ;;
    "restart")
        check_docker
        stop_network
        check_images
        start_network
        ;;
    "status")
        check_docker
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac