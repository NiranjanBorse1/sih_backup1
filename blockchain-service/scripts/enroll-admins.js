require('dotenv').config();

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const caURL = process.env.CA_URL || 'https://default-ca.example.com';
const caPort = process.env.CA_PORT || '7054';
const blockchainAPI = process.env.BLOCKCHAIN_API || 'https://default-blockchain.example.com';
const enrollmentID = process.env.ENROLLMENT_ID || 'admin';
const enrollmentSecret = process.env.ENROLLMENT_SECRET || 'adminpw';

async function enrollAdmin(caUrl, wallet, orgMspId, adminUserId, adminUserPasswd, caName) {
    try {
        // Check if admin is already enrolled
        const identityLabel = `${orgMspId}_admin`;
        const identity = await wallet.get(identityLabel);
        if (identity) {
            console.log(`An identity for the admin user ${identityLabel} already exists in the wallet`);
            return;
        }

        // Create CA client
        const caClient = new FabricCAServices(caUrl, {
            trustedRoots: [],
            verify: false
        }, caName);

        // Enroll the admin user
        console.log(`Enrolling admin for ${orgMspId}...`);
        const enrollment = await caClient.enroll({
            enrollmentID: adminUserId,
            enrollmentSecret: adminUserPasswd
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };

        await wallet.put(identityLabel, x509Identity);
        console.log(`Successfully enrolled admin user for ${orgMspId} and imported it into the wallet`);
    } catch (error) {
        console.error(`Failed to enroll admin user for ${orgMspId}: ${error}`);
        throw error;
    }
}

async function main() {
    try {
        // Create a new wallet for identities
        const walletPath = path.resolve(__dirname, '..', 'api', 'config', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        console.log('Creating wallet directory if it doesn\'t exist...');
        if (!fs.existsSync(walletPath)) {
            fs.mkdirSync(walletPath, { recursive: true });
        }

        // Enroll Tourism Authority admin
        await enrollAdmin(
            `${caURL}`,
            wallet,
            'TourismAuthorityMSP',
            `${enrollmentID}`,
            `${enrollmentSecret}`,
            'ca.tourismauthority.com'
        );

        // Enroll Security NGO admin
        await enrollAdmin(
            `${caURL}`,
            wallet,
            'SecurityNGOMSP',
            `${enrollmentID}`,
            `${enrollmentSecret}`,
            'ca.securityngo.com'
        );

        console.log('Successfully enrolled all admin users');
    } catch (error) {
        console.error('Failed to enroll admin users:', error);
        process.exit(1);
    }
}

main();