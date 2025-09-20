#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Enrolling admin users for organizations...${NC}"

# Ensure we're in the blockchain-service directory
cd "$(dirname "$0")/.."

# First, make sure the wallet directory exists
mkdir -p api/config/wallet

# Run the enrollment script
echo -e "${YELLOW}Running enrollment script...${NC}"
node scripts/enroll-admins.js

echo -e "${GREEN}Admin enrollment completed!${NC}"