#!/usr/bin/env node

/**
 * Demo Script for Tourist Safety Blockchain Service
 * Demonstrates end-to-end blockchain functionality for SIH 2025 presentation
 */

const axios = require('axios');
const { sampleTourists, sampleIncidents } = require('../tests/sample-data');

const BASE_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3001';
const DEMO_DELAY = 2000; // 2 seconds between demo steps

class BlockchainDemo {
    constructor() {
        this.baseURL = BASE_URL;
        this.demoTourist = null;
        this.demoIncidents = [];
    }

    async runDemo() {
        console.log('\n🎯 Tourist Safety Blockchain Service Demo');
        console.log('==========================================');
        console.log('SIH 2025 - Team Visioneers\n');

        try {
            await this.step1_HealthCheck();
            await this.step2_TouristRegistration();
            await this.step3_GeofenceBreach();
            await this.step4_AnomalyDetection();
            await this.step5_SOSAlert();
            await this.step6_AuthorityResponse();
            await this.step7_IncidentResolution();
            await this.step8_AuditTrail();
            await this.step9_Statistics();
            await this.conclusion();
        } catch (error) {
            console.error('\n❌ Demo failed:', error.message);
            process.exit(1);
        }
    }

    async step1_HealthCheck() {
        console.log('🏥 Step 1: Blockchain Service Health Check');
        console.log('--------------------------------------------');
        
        try {
            const response = await axios.get(`${this.baseURL}/health`);
            console.log(`✅ Service Status: ${response.data.status}`);
            console.log(`🔧 Version: ${response.data.version}`);
            console.log(`🕐 Response Time: ${Date.now() - Date.parse(response.data.timestamp)}ms\n`);
        } catch (error) {
            console.log('❌ Service health check failed');
            throw error;
        }
        
        await this.delay();
    }

    async step2_TouristRegistration() {
        console.log('👤 Step 2: Tourist Digital Identity (DeID) Registration');
        console.log('--------------------------------------------------------');
        
        const tourist = {
            name: "Priya Sharma",
            nationality: "India",
            phoneNumber: "+91-9876543210",
            emergencyContact: "+91-9876543211",
            email: "priya.sharma@gmail.com",
            dateOfBirth: "1992-03-22",
            passportNumber: "M1234567"
        };
        
        console.log(`📝 Registering tourist: ${tourist.name}`);
        console.log(`🌍 Nationality: ${tourist.nationality}`);
        console.log(`📱 Phone: ${tourist.phoneNumber}`);
        
        try {
            const response = await axios.post(`${this.baseURL}/blockchain/registerDeID`, tourist);
            
            this.demoTourist = {
                ...tourist,
                touristId: response.data.data.touristId,
                publicKey: response.data.data.publicKey
            };
            
            console.log(`✅ Tourist registered successfully!`);
            console.log(`🆔 Tourist ID: ${this.demoTourist.touristId}`);
            console.log(`🔑 Public Key: ${this.demoTourist.publicKey.substring(0, 50)}...`);
            console.log(`🔗 Blockchain: Identity stored immutably\n`);
            
        } catch (error) {
            console.log('❌ Tourist registration failed');
            throw error;
        }
        
        await this.delay();
    }

    async step3_GeofenceBreach() {
        console.log('🚨 Step 3: Geofence Breach Detection');
        console.log('-------------------------------------');
        
        const breachIncident = {
            touristId: this.demoTourist.touristId,
            eventType: 'breach',
            location: {
                latitude: 28.6139,
                longitude: 77.2090,
                address: 'Red Fort, Delhi, India - Restricted Archaeological Area',
                geofenceId: 'HISTORICAL_MONUMENT_001'
            },
            severity: 'high',
            description: 'Tourist entered restricted archaeological area during excavation',
            reportedBy: 'geofence-backend',
            metadata: {
                polygonId: 'red_fort_archaeological_zone',
                breachTime: new Date().toISOString(),
                confidence: 1.0,
                restrictionReason: 'Archaeological excavation in progress'
            }
        };
        
        console.log(`📍 Location: ${breachIncident.location.address}`);
        console.log(`⚠️  Severity: ${breachIncident.severity.toUpperCase()}`);
        console.log(`🤖 Detected by: Geofence Backend System`);
        
        try {
            const response = await axios.post(`${this.baseURL}/blockchain/logIncident`, breachIncident);
            
            this.demoIncidents.push({
                ...breachIncident,
                incidentId: response.data.data.incidentId
            });
            
            console.log(`✅ Breach incident logged to blockchain`);
            console.log(`🆔 Incident ID: ${response.data.data.incidentId}`);
            console.log(`⏰ Timestamp: ${response.data.data.timestamp}`);
            console.log(`🔗 Blockchain: Immutable audit trail created\n`);
            
        } catch (error) {
            console.log('❌ Failed to log geofence breach');
            throw error;
        }
        
        await this.delay();
    }

    async step4_AnomalyDetection() {
        console.log('🤖 Step 4: AI Anomaly Detection');
        console.log('--------------------------------');
        
        const anomalyIncident = {
            touristId: this.demoTourist.touristId,
            eventType: 'anomaly',
            location: {
                latitude: 28.6129,
                longitude: 77.2295,
                address: 'Chandni Chowk Market, Delhi, India'
            },
            severity: 'medium',
            description: 'Unusual movement pattern: Tourist stationary for 45 minutes in crowded area',
            reportedBy: 'ai-engine',
            metadata: {
                algorithm: 'isolation_forest',
                anomalyScore: 0.87,
                confidence: 0.94,
                patternType: 'extended_stationary',
                stationaryDuration: 45,
                crowdDensity: 'high'
            }
        };
        
        console.log(`🧠 AI Algorithm: Isolation Forest`);
        console.log(`📊 Anomaly Score: ${anomalyIncident.metadata.anomalyScore}`);
        console.log(`🎯 Confidence: ${(anomalyIncident.metadata.confidence * 100).toFixed(1)}%`);
        console.log(`📍 Pattern: Extended stationary in crowded area`);
        
        try {
            const response = await axios.post(`${this.baseURL}/blockchain/logIncident`, anomalyIncident);
            
            this.demoIncidents.push({
                ...anomalyIncident,
                incidentId: response.data.data.incidentId
            });
            
            console.log(`✅ AI anomaly logged to blockchain`);
            console.log(`🆔 Incident ID: ${response.data.data.incidentId}`);
            console.log(`🔗 Blockchain: AI detection permanently recorded\n`);
            
        } catch (error) {
            console.log('❌ Failed to log AI anomaly');
            throw error;
        }
        
        await this.delay();
    }

    async step5_SOSAlert() {
        console.log('🆘 Step 5: Emergency SOS Alert');
        console.log('-------------------------------');
        
        const sosIncident = {
            touristId: this.demoTourist.touristId,
            eventType: 'sos',
            location: {
                latitude: 28.6145,
                longitude: 77.2088,
                address: 'Red Fort Metro Station, Delhi, India'
            },
            severity: 'critical',
            description: 'Emergency SOS triggered by tourist - Medical assistance required',
            reportedBy: 'tourist',
            metadata: {
                triggerMethod: 'mobile_app_panic_button',
                sosType: 'medical_emergency',
                deviceId: 'PHONE_PRIYA_001',
                batteryLevel: 23,
                networkSignal: 'strong'
            }
        };
        
        console.log(`🚨 CRITICAL EMERGENCY ALERT 🚨`);
        console.log(`📱 Triggered by: Tourist (Panic Button)`);
        console.log(`🏥 Emergency Type: Medical Assistance`);
        console.log(`📍 Location: ${sosIncident.location.address}`);
        console.log(`🔋 Device Battery: ${sosIncident.metadata.batteryLevel}%`);
        
        try {
            const response = await axios.post(`${this.baseURL}/blockchain/logIncident`, sosIncident);
            
            this.demoIncidents.push({
                ...sosIncident,
                incidentId: response.data.data.incidentId
            });
            
            console.log(`✅ SOS alert logged to blockchain`);
            console.log(`🆔 Incident ID: ${response.data.data.incidentId}`);
            console.log(`🚨 Priority: IMMEDIATE RESPONSE REQUIRED`);
            console.log(`🔗 Blockchain: Emergency permanently documented\n`);
            
        } catch (error) {
            console.log('❌ Failed to log SOS alert');
            throw error;
        }
        
        await this.delay();
    }

    async step6_AuthorityResponse() {
        console.log('🚔 Step 6: Authority Emergency Response');
        console.log('---------------------------------------');
        
        if (this.demoIncidents.length === 0) {
            console.log('❌ No incidents to respond to');
            return;
        }
        
        const sosIncident = this.demoIncidents.find(i => i.eventType === 'sos');
        if (!sosIncident) {
            console.log('❌ No SOS incident found');
            return;
        }
        
        console.log(`📞 Authority Dispatch Center activated`);
        console.log(`🚑 Medical team dispatched to location`);
        console.log(`⏱️  Estimated arrival: 8 minutes`);
        
        try {
            const updateResponse = await axios.put(
                `${this.baseURL}/blockchain/incidents/${sosIncident.incidentId}`,
                {
                    status: 'in-progress',
                    responderId: 'AUTH_DELHI_MEDICAL_001',
                    resolutionNotes: 'Medical team dispatched - Ambulance ETA 8 minutes'
                }
            );
            
            console.log(`✅ Incident status updated: IN-PROGRESS`);
            console.log(`👮 Responder ID: AUTH_DELHI_MEDICAL_001`);
            console.log(`🔗 Blockchain: Response time recorded immutably`);
            
            // Log response incident
            const responseIncident = {
                touristId: this.demoTourist.touristId,
                eventType: 'response',
                location: sosIncident.location,
                severity: 'high',
                description: 'Medical emergency response team dispatched',
                reportedBy: 'emergency-services',
                metadata: {
                    responseTeamId: 'MEDICAL_DELHI_001',
                    teamType: 'ambulance',
                    estimatedArrival: '8 minutes',
                    relatedIncidentId: sosIncident.incidentId,
                    equipment: ['defibrillator', 'oxygen', 'basic_medications']
                }
            };
            
            const responseLog = await axios.post(`${this.baseURL}/blockchain/logIncident`, responseIncident);
            console.log(`🚑 Response team dispatch logged: ${responseLog.data.data.incidentId}\n`);
            
        } catch (error) {
            console.log('❌ Failed to update incident status');
            throw error;
        }
        
        await this.delay();
    }

    async step7_IncidentResolution() {
        console.log('✅ Step 7: Incident Resolution');
        console.log('-------------------------------');
        
        const sosIncident = this.demoIncidents.find(i => i.eventType === 'sos');
        if (!sosIncident) {
            console.log('❌ No SOS incident to resolve');
            return;
        }
        
        console.log(`🏥 Medical team arrived at scene`);
        console.log(`👩‍⚕️ Tourist provided first aid`);
        console.log(`🚗 Tourist safely transported to nearby clinic`);
        console.log(`✅ Emergency successfully resolved`);
        
        try {
            const resolutionResponse = await axios.put(
                `${this.baseURL}/blockchain/incidents/${sosIncident.incidentId}`,
                {
                    status: 'resolved',
                    responderId: 'AUTH_DELHI_MEDICAL_001',
                    resolutionNotes: 'Tourist safely treated and transported to clinic. Minor injury - full recovery expected.'
                }
            );
            
            console.log(`✅ Incident marked as RESOLVED`);
            console.log(`📝 Resolution notes recorded`);
            console.log(`⏱️  Total response time: 12 minutes`);
            console.log(`🔗 Blockchain: Complete incident lifecycle documented\n`);
            
        } catch (error) {
            console.log('❌ Failed to resolve incident');
            throw error;
        }
        
        await this.delay();
    }

    async step8_AuditTrail() {
        console.log('📋 Step 8: Immutable Audit Trail');
        console.log('---------------------------------');
        
        console.log(`👤 Querying all incidents for tourist: ${this.demoTourist.name}`);
        
        try {
            const response = await axios.get(`${this.baseURL}/blockchain/incidents?touristId=${this.demoTourist.touristId}`);
            
            const incidents = response.data.data;
            console.log(`📊 Total incidents found: ${incidents.length}`);
            console.log(`🔗 All data stored immutably on blockchain\n`);
            
            console.log('📜 Incident Timeline:');
            console.log('----------------------');
            incidents.forEach((incident, index) => {
                const time = new Date(incident.timestamp).toLocaleTimeString();
                console.log(`${index + 1}. [${time}] ${incident.eventType.toUpperCase()}: ${incident.description}`);
                console.log(`   📍 ${incident.location.address || 'Location data'}`);
                console.log(`   ⚠️  Severity: ${incident.severity}`);
                console.log(`   🆔 ID: ${incident.incidentId}\n`);
            });
            
        } catch (error) {
            console.log('❌ Failed to retrieve audit trail');
            throw error;
        }
        
        await this.delay();
    }

    async step9_Statistics() {
        console.log('📊 Step 9: Real-time Analytics');
        console.log('-------------------------------');
        
        try {
            const response = await axios.get(`${this.baseURL}/blockchain/incidents/statistics`);
            
            const stats = response.data.data;
            console.log(`📈 System-wide Statistics:`);
            console.log(`   Total Incidents: ${stats.totalIncidents}`);
            console.log(`   Average Response Time: ${stats.averageResponseTime} minutes`);
            
            console.log(`\n🏷️  By Event Type:`);
            Object.entries(stats.byEventType).forEach(([type, count]) => {
                console.log(`   ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`);
            });
            
            console.log(`\n🎯 By Severity:`);
            Object.entries(stats.bySeverity).forEach(([severity, count]) => {
                console.log(`   ${severity.charAt(0).toUpperCase() + severity.slice(1)}: ${count}`);
            });
            
            console.log(`\n📋 By Status:`);
            Object.entries(stats.byStatus).forEach(([status, count]) => {
                console.log(`   ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`);
            });
            
            console.log(`\n🔗 All statistics derived from immutable blockchain data\n`);
            
        } catch (error) {
            console.log('❌ Failed to retrieve statistics');
            throw error;
        }
        
        await this.delay();
    }

    async conclusion() {
        console.log('🎯 Demo Conclusion');
        console.log('==================');
        console.log('✅ Tourist Safety Blockchain Service - Complete Demo');
        console.log('');
        console.log('🌟 Key Features Demonstrated:');
        console.log('   ✓ Decentralized Tourist Identity (DeID)');
        console.log('   ✓ Immutable Incident Logging');
        console.log('   ✓ Real-time Emergency Response');
        console.log('   ✓ Complete Audit Trail');
        console.log('   ✓ Multi-channel Integration');
        console.log('   ✓ Analytics & Reporting');
        console.log('');
        console.log('🔗 Blockchain Benefits:');
        console.log('   ✓ Tamper-proof data storage');
        console.log('   ✓ Multi-organization trust');
        console.log('   ✓ Transparent audit trail');
        console.log('   ✓ Immutable evidence');
        console.log('');
        console.log('🏆 SIH 2025 - Team Visioneers');
        console.log('🎯 Smart Tourist Safety Monitoring System');
        console.log('📧 Contact: visioneers@sih2025.com');
        console.log('');
        console.log('Thank you for the demonstration! 🙏');
    }

    async delay() {
        return new Promise(resolve => setTimeout(resolve, DEMO_DELAY));
    }
}

// Run the demo
if (require.main === module) {
    const demo = new BlockchainDemo();
    demo.runDemo().catch(error => {
        console.error('Demo failed:', error);
        process.exit(1);
    });
}

module.exports = BlockchainDemo;