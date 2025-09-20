const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
    const walletPath = path.resolve(__dirname, '..', 'api', 'config', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Create wallet directory if it doesn't exist
    if (!fs.existsSync(walletPath)) {
        fs.mkdirSync(walletPath, { recursive: true });
    }

    // Setup for Tourism Authority
    const caTA = new FabricCAServices('https://localhost:7054', {
        trustedRoots: [],
        verify: false
    }, 'ca.tourismauthority.com');

    // Setup for Security NGO
    const caSec = new FabricCAServices('https://localhost:8054', {
        trustedRoots: [],
        verify: false
    }, 'ca.securityngo.com');

    try {
        // Enroll Tourism Authority Admin
        const taEnrollment = await caTA.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        });

        const taIdentity = {
            credentials: {
                certificate: taEnrollment.certificate,
                privateKey: taEnrollment.key.toBytes(),
            },
            mspId: 'TourismAuthorityMSP',
            type: 'X.509',
        };

        await wallet.put('TourismAuthorityMSP_admin', taIdentity);
        console.log('Successfully enrolled Tourism Authority admin');

        // Enroll Security NGO Admin
        const secEnrollment = await caSec.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        });

        const secIdentity = {
            credentials: {
                certificate: secEnrollment.certificate,
                privateKey: secEnrollment.key.toBytes(),
            },
            mspId: 'SecurityNGOMSP',
            type: 'X.509',
        };

        await wallet.put('SecurityNGOMSP_admin', secIdentity);
        console.log('Successfully enrolled Security NGO admin');

    } catch (error) {
        console.error('Error enrolling admins:', error);
        process.exit(1);
    }
}

enrollAdmin().then(() => {
    console.log('Enrollment complete');
}).catch((error) => {
    console.error('Failed to enroll admins:', error);
    process.exit(1);
});