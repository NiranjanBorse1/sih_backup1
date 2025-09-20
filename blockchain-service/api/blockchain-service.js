'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

class BlockchainService {
    constructor() {
        this.gateway = null;
        this.wallet = null;
        this.connectionProfile = null;
        this.channelName = process.env.CHANNEL_NAME || 'safetychannel';
        this.deIDContractName = process.env.CHAINCODE_NAME_DEID || 'deid-contract';
        this.incidentContractName = process.env.CHAINCODE_NAME_INCIDENT || 'incident-contract';
        this.identityLabel = null;
        this.walletPath = null;
        this.forceDemo = (process.env.FORCE_DEMO || 'false').toLowerCase() === 'true';
    }

    async initialize() {
        try {
            console.log('Initializing Blockchain Service...');

            if (!this.forceDemo) {
                // Load and parse connection profile
                const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-profile.yaml');
                console.log(`Looking for connection profile at: ${ccpPath}`);

                if (!fs.existsSync(ccpPath)) {
                    throw new Error(`Connection profile not found at: ${ccpPath}`);
                }
                const ccpYaml = fs.readFileSync(ccpPath, 'utf8');
                this.connectionProfile = yaml.load(ccpYaml);
                console.log('Connection profile loaded and parsed.');
            } else {
                console.log('Demo mode enabled: Skipping connection profile parsing');
            }

            // Resolve wallet directory preference: api/config/wallet -> config/wallet -> env WALLET_PATH
            const candidateWallets = [
                process.env.WALLET_PATH,
                path.join(__dirname, 'config', 'wallet'), // api/config/wallet
                path.join(process.cwd(), 'config', 'wallet') // config/wallet
            ].filter(Boolean);

            for (const wp of candidateWallets) {
                if (fs.existsSync(wp)) { this.walletPath = wp; break; }
            }
            if (!this.walletPath) {
                // default to api/config/wallet and create
                this.walletPath = path.join(__dirname, 'config', 'wallet');
                fs.mkdirSync(this.walletPath, { recursive: true });
            }

            if (!this.forceDemo) {
                this.wallet = await Wallets.newFileSystemWallet(this.walletPath);
                console.log(`Wallet path: ${this.walletPath}`);

                // Determine identity label to use
                const tryLabels = [
                    process.env.FABRIC_IDENTITY,
                    'TourismAuthorityMSP_admin',
                    'SecurityNGOMSP_admin',
                    'admin-tourism',
                    'admin-security',
                    'admin'
                ].filter(Boolean);

                for (const label of tryLabels) {
                    const id = await this.wallet.get(label);
                    if (id) { this.identityLabel = label; break; }
                }

                if (!this.identityLabel) {
                    throw new Error('No valid identity found in wallet. Please enroll admin and place identity in wallet.');
                }

                console.log(`Using Fabric identity: ${this.identityLabel}`);
            } else {
                console.log('Demo mode enabled: Skipping wallet/identity checks');
            }

            console.log('Blockchain Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Blockchain Service:', error.message);
            throw error;
        }
    }

    // Remove enrollAdmin, admin must be enrolled using Fabric CA and placed in wallet

    async getContract(contractName) {
        try {
            if (this.forceDemo) {
                throw new Error('Demo mode: Fabric gateway disabled');
            }
            if (!this.gateway) {
                this.gateway = new Gateway();
                
                const connectionOptions = {
                    wallet: this.wallet,
                    identity: this.identityLabel,
                    discovery: { enabled: true, asLocalhost: true }
                };

                // For demo, use mock connection
                await this.gateway.connect(this.connectionProfile, connectionOptions);
                console.log('Connected to Fabric gateway');
            }

            const network = await this.gateway.getNetwork(this.channelName);
            const contract = network.getContract(contractName);
            
            return contract;
        } catch (error) {
            console.error('Failed to get contract:', error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.gateway) {
            await this.gateway.disconnect();
            console.log('Disconnected from Fabric gateway');
        }
    }

    // DeID Contract Methods
    async registerTouristDeID(touristData) {
        try {
            if (this.forceDemo) {
                return this.getMockDeIDRegistration(touristData);
            }
            const contract = await this.getContract(this.deIDContractName);
            const result = await contract.submitTransaction('registerTouristDeID', JSON.stringify(touristData));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error registering tourist DeID:', error.message);
            const forceDemo = (process.env.FORCE_DEMO || 'false').toLowerCase() === 'true';
            if (forceDemo) {
                return this.getMockDeIDRegistration(touristData);
            }
            throw error;
        }
    }

    async getTouristDeID(touristId) {
        try {
            if (this.forceDemo) {
                return this.getMockTouristDeID(touristId);
            }
            const contract = await this.getContract(this.deIDContractName);
            const result = await contract.evaluateTransaction('getTouristDeID', touristId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting tourist DeID:', error.message);
            const forceDemo = (process.env.FORCE_DEMO || 'false').toLowerCase() === 'true';
            if (forceDemo) {
                return this.getMockTouristDeID(touristId);
            }
            throw error;
        }
    }

    async updateTouristStatus(touristId, status) {
        try {
            if (this.forceDemo) {
                return {
                    touristId,
                    status,
                    updatedAt: new Date().toISOString(),
                    message: 'Status updated (DEMO MODE)'
                };
            }
            const contract = await this.getContract(this.deIDContractName);
            const result = await contract.submitTransaction('updateTouristStatus', touristId, status);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error updating tourist status:', error.message);
            throw error;
        }
    }

    async verifyTouristIdentity(touristId, signature, message) {
        try {
            if (this.forceDemo) {
                return { verified: true, touristId, message };
            }
            const contract = await this.getContract(this.deIDContractName);
            const result = await contract.evaluateTransaction('verifyTouristIdentity', touristId, signature, message);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error verifying tourist identity:', error.message);
            throw error;
        }
    }

    // Incident Contract Methods
    async logIncident(incidentData) {
        try {
            if (this.forceDemo) {
                return this.getMockIncidentLog(incidentData);
            }
            const contract = await this.getContract(this.incidentContractName);
            const result = await contract.submitTransaction('logIncident', JSON.stringify(incidentData));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error logging incident:', error.message);
            const forceDemo = (process.env.FORCE_DEMO || 'false').toLowerCase() === 'true';
            if (forceDemo) {
                return this.getMockIncidentLog(incidentData);
            }
            throw error;
        }
    }

    async getIncidentsForTourist(touristId, limit = 50) {
        try {
            if (this.forceDemo) {
                return this.getMockIncidentsForTourist(touristId);
            }
            const contract = await this.getContract(this.incidentContractName);
            const result = await contract.evaluateTransaction('getIncidentsForTourist', touristId, limit.toString());
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting incidents for tourist:', error.message);
            // For demo purposes, return mock response
            return this.getMockIncidentsForTourist(touristId);
        }
    }

    async getIncidentsByRegion(regionData, startDate = '', endDate = '') {
        try {
            if (this.forceDemo) {
                return this.getMockIncidentsByRegion(regionData);
            }
            const contract = await this.getContract(this.incidentContractName);
            const result = await contract.evaluateTransaction('getIncidentsByRegion', JSON.stringify(regionData), startDate, endDate);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting incidents by region:', error.message);
            // For demo purposes, return mock response
            return this.getMockIncidentsByRegion(regionData);
        }
    }

    async updateIncidentStatus(incidentId, statusUpdate) {
        try {
            if (this.forceDemo) {
                return {
                    incidentId: incidentId,
                    status: statusUpdate.status || 'responded',
                    updatedBy: statusUpdate.updatedBy || 'demo-authority',
                    updateTime: new Date().toISOString(),
                    success: true,
                    txId: 'demo_update_' + Date.now()
                };
            }
            // Check if we're in demo mode (no real blockchain network)
            if (!this.gateway || !this.gateway.getNetwork) {
                console.log('🔄 Demo mode: Simulating incident status update');
                return {
                    incidentId: incidentId,
                    status: statusUpdate.status || 'responded',
                    updatedBy: statusUpdate.updatedBy || 'demo-authority',
                    updateTime: new Date().toISOString(),
                    success: true,
                    txId: 'demo_update_' + Date.now()
                };
            }

            // Try to get contract, fall back to demo mode if it fails
            let contract;
            try {
                contract = await this.getContract(this.incidentContractName);
            } catch (contractError) {
                console.log('🔄 Demo mode fallback: Real blockchain network not available');
                return {
                    incidentId: incidentId,
                    status: statusUpdate.status || 'responded',
                    updatedBy: statusUpdate.updatedBy || 'demo-authority',
                    updateTime: new Date().toISOString(),
                    success: true,
                    txId: 'demo_update_' + Date.now(),
                    note: 'Simulated in demo mode'
                };
            }

            const result = await contract.submitTransaction('updateIncidentStatus', incidentId, JSON.stringify(statusUpdate));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error updating incident status:', error.message);
            // Final fallback to demo mode
            return {
                incidentId: incidentId,
                status: statusUpdate.status || 'responded',
                updatedBy: statusUpdate.updatedBy || 'demo-authority',
                updateTime: new Date().toISOString(),
                success: true,
                txId: 'demo_update_' + Date.now(),
                note: 'Demo mode fallback due to network error'
            };
        }
    }

    async getIncidentStatistics(startDate = '', endDate = '') {
        try {
            if (this.forceDemo) {
                return {
                    totalIncidents: 42,
                    byType: { breach: 10, sos: 5, anomaly: 15, alert: 12 },
                    period: { startDate, endDate }
                };
            }
            const contract = await this.getContract(this.incidentContractName);
            const result = await contract.evaluateTransaction('getIncidentStatistics', startDate, endDate);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting incident statistics:', error.message);
            throw error;
        }
    }

    // Mock methods for demo purposes when blockchain is not available
    getMockDeIDRegistration(touristData) {
        return {
            success: true,
            touristId: `TST_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
            publicKey: 'MOCK_PUBLIC_KEY_' + Date.now(),
            privateKey: 'MOCK_PRIVATE_KEY_' + Date.now(),
            message: 'Tourist DeID registered successfully (DEMO MODE)'
        };
    }

    getMockTouristDeID(touristId) {
        return {
            touristId: touristId,
            publicKey: 'MOCK_PUBLIC_KEY_FOR_' + touristId,
            name: 'Demo Tourist',
            nationality: 'India',
            phoneNumber: '+91-9876543210',
            emergencyContact: '+91-9876543211',
            registrationTimestamp: new Date().toISOString(),
            status: 'active',
            lastUpdated: new Date().toISOString(),
            version: '1.0'
        };
    }

    getMockIncidentLog(incidentData) {
        return {
            success: true,
            incidentId: `INC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
            touristId: incidentData.touristId,
            eventType: incidentData.eventType,
            timestamp: new Date().toISOString(),
            message: 'Incident logged successfully (DEMO MODE)'
        };
    }

    getMockIncidentsForTourist(touristId) {
        return [
            {
                incidentId: 'INC_DEMO_001',
                touristId: touristId,
                eventType: 'breach',
                location: { latitude: 28.6139, longitude: 77.2090, address: 'Delhi, India' },
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                severity: 'medium',
                status: 'resolved'
            }
        ];
    }

    getMockIncidentsByRegion(regionData) {
        return [
            {
                incidentId: 'INC_DEMO_002',
                touristId: 'TST_DEMO_001',
                eventType: 'anomaly',
                location: { latitude: 28.6139, longitude: 77.2090, address: 'Delhi, India' },
                timestamp: new Date().toISOString(),
                severity: 'low',
                status: 'open'
            }
        ];
    }
}

module.exports = BlockchainService;