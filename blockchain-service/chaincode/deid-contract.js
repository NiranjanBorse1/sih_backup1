'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class DeIDContract extends Contract {

    // Initialize the chaincode
    async initLedger(ctx) {
        console.info('============= START : Initialize DeID Ledger ===========');
        // Initialize with any setup data if needed
        const initData = {
            contractVersion: '1.0.0',
            initialized: true,
            timestamp: new Date().toISOString()
        };
        await ctx.stub.putState('INIT_DEID', Buffer.from(JSON.stringify(initData)));
        console.info('============= END : Initialize DeID Ledger ===========');
    }

    // Register a new Tourist Digital Identity (DeID)
    async registerTouristDeID(ctx, touristData) {
        console.info('============= START : Register Tourist DeID ===========');
        
        try {
            const data = JSON.parse(touristData);
            
            // Validate required fields
            this._validateTouristData(data);
            
            // Generate unique tourist ID if not provided
            const touristId = data.touristId || this._generateTouristId();
            
            // Check if tourist already exists
            const existingTourist = await this._getTouristIfExists(ctx, touristId);
            if (existingTourist) {
                throw new Error(`Tourist with ID ${touristId} already exists`);
            }

            // Generate public/private key pair for the tourist
            const keyPair = this._generateKeyPair();
            
            // Create tourist DeID record
            const touristDeID = {
                touristId: touristId,
                publicKey: keyPair.publicKey,
                name: data.name,
                nationality: data.nationality,
                phoneNumber: data.phoneNumber,
                emergencyContact: data.emergencyContact,
                email: data.email || '',
                dateOfBirth: data.dateOfBirth || '',
                passportNumber: data.passportNumber || '',
                registrationTimestamp: new Date().toISOString(),
                status: 'active',
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };

            // Store the DeID on the ledger
            await ctx.stub.putState(touristId, Buffer.from(JSON.stringify(touristDeID)));
            
            // Create index for efficient querying
            const indexName = 'nationality~touristId';
            const indexKey = await ctx.stub.createCompositeKey(indexName, [data.nationality, touristId]);
            await ctx.stub.putState(indexKey, Buffer.from('\u0000'));

            console.info(`Tourist DeID registered successfully: ${touristId}`);
            
            // Return the tourist ID and public key (private key should be returned securely)
            return JSON.stringify({
                success: true,
                touristId: touristId,
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey, // In production, handle this securely
                message: 'Tourist DeID registered successfully'
            });

        } catch (error) {
            console.error(`Error registering tourist DeID: ${error.message}`);
            throw new Error(`Failed to register tourist DeID: ${error.message}`);
        }
    }

    // Get Tourist DeID information
    async getTouristDeID(ctx, touristId) {
        console.info(`============= START : Get Tourist DeID ${touristId} ===========`);
        
        try {
            const touristBytes = await ctx.stub.getState(touristId);
            if (!touristBytes || touristBytes.length === 0) {
                throw new Error(`Tourist with ID ${touristId} does not exist`);
            }

            const tourist = JSON.parse(touristBytes.toString());
            
            // Remove sensitive information before returning
            const publicTouristInfo = {
                touristId: tourist.touristId,
                publicKey: tourist.publicKey,
                name: tourist.name,
                nationality: tourist.nationality,
                phoneNumber: tourist.phoneNumber,
                emergencyContact: tourist.emergencyContact,
                registrationTimestamp: tourist.registrationTimestamp,
                status: tourist.status,
                lastUpdated: tourist.lastUpdated,
                version: tourist.version
            };

            console.info(`Tourist DeID retrieved successfully: ${touristId}`);
            return JSON.stringify(publicTouristInfo);

        } catch (error) {
            console.error(`Error getting tourist DeID: ${error.message}`);
            throw new Error(`Failed to get tourist DeID: ${error.message}`);
        }
    }

    // Update Tourist DeID status (active/inactive)
    async updateTouristStatus(ctx, touristId, newStatus) {
        console.info(`============= START : Update Tourist Status ${touristId} ===========`);
        
        try {
            const touristBytes = await ctx.stub.getState(touristId);
            if (!touristBytes || touristBytes.length === 0) {
                throw new Error(`Tourist with ID ${touristId} does not exist`);
            }

            const tourist = JSON.parse(touristBytes.toString());
            
            // Validate status
            if (!['active', 'inactive', 'suspended'].includes(newStatus)) {
                throw new Error(`Invalid status: ${newStatus}. Must be 'active', 'inactive', or 'suspended'`);
            }

            tourist.status = newStatus;
            tourist.lastUpdated = new Date().toISOString();

            await ctx.stub.putState(touristId, Buffer.from(JSON.stringify(tourist)));

            console.info(`Tourist status updated successfully: ${touristId} -> ${newStatus}`);
            return JSON.stringify({
                success: true,
                touristId: touristId,
                newStatus: newStatus,
                message: 'Tourist status updated successfully'
            });

        } catch (error) {
            console.error(`Error updating tourist status: ${error.message}`);
            throw new Error(`Failed to update tourist status: ${error.message}`);
        }
    }

    // Get all tourists by nationality (for authorities)
    async getTouristsByNationality(ctx, nationality) {
        console.info(`============= START : Get Tourists by Nationality ${nationality} ===========`);
        
        try {
            const indexName = 'nationality~touristId';
            const iterator = await ctx.stub.getStateByPartialCompositeKey(indexName, [nationality]);
            
            const tourists = [];
            let result = await iterator.next();
            
            while (!result.done) {
                const responseRange = result.value;
                const objectType = responseRange.key;
                const attributes = await ctx.stub.splitCompositeKey(objectType);
                const touristId = attributes.attributes[1];
                
                // Get the actual tourist data
                const touristBytes = await ctx.stub.getState(touristId);
                if (touristBytes && touristBytes.length > 0) {
                    const tourist = JSON.parse(touristBytes.toString());
                    tourists.push({
                        touristId: tourist.touristId,
                        name: tourist.name,
                        nationality: tourist.nationality,
                        registrationTimestamp: tourist.registrationTimestamp,
                        status: tourist.status
                    });
                }
                
                result = await iterator.next();
            }
            
            await iterator.close();
            
            console.info(`Found ${tourists.length} tourists with nationality: ${nationality}`);
            return JSON.stringify(tourists);

        } catch (error) {
            console.error(`Error getting tourists by nationality: ${error.message}`);
            throw new Error(`Failed to get tourists by nationality: ${error.message}`);
        }
    }

    // Verify Tourist Identity using digital signature
    async verifyTouristIdentity(ctx, touristId, signature, message) {
        console.info(`============= START : Verify Tourist Identity ${touristId} ===========`);
        
        try {
            const touristBytes = await ctx.stub.getState(touristId);
            if (!touristBytes || touristBytes.length === 0) {
                throw new Error(`Tourist with ID ${touristId} does not exist`);
            }

            const tourist = JSON.parse(touristBytes.toString());
            
            // In a real implementation, you would verify the signature using the public key
            // For demo purposes, we'll return a simplified verification
            const isValid = this._verifySignature(tourist.publicKey, signature, message);
            
            console.info(`Identity verification for ${touristId}: ${isValid ? 'VALID' : 'INVALID'}`);
            return JSON.stringify({
                touristId: touristId,
                verified: isValid,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error(`Error verifying tourist identity: ${error.message}`);
            throw new Error(`Failed to verify tourist identity: ${error.message}`);
        }
    }

    // Helper Methods

    _validateTouristData(data) {
        const requiredFields = ['name', 'nationality', 'phoneNumber', 'emergencyContact'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate phone number format (basic validation)
        if (!/^\+?[\d\s\-\(\)]+$/.test(data.phoneNumber)) {
            throw new Error('Invalid phone number format');
        }

        // Validate emergency contact format
        if (!/^\+?[\d\s\-\(\)]+$/.test(data.emergencyContact)) {
            throw new Error('Invalid emergency contact format');
        }
    }

    async _getTouristIfExists(ctx, touristId) {
        const touristBytes = await ctx.stub.getState(touristId);
        if (!touristBytes || touristBytes.length === 0) {
            return null;
        }
        return JSON.parse(touristBytes.toString());
    }

    _generateTouristId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `TST_${timestamp}_${random}`.toUpperCase();
    }

    _generateKeyPair() {
        // In production, use proper cryptographic libraries
        // This is a simplified version for demo
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        return {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey
        };
    }

    _verifySignature(publicKey, signature, message) {
        // Simplified verification for demo
        // In production, implement proper signature verification
        return signature && message && signature.length > 10;
    }
}

module.exports = DeIDContract;