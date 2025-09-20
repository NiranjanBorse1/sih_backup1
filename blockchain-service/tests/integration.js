#!/usr/bin/env node

/**
 * Integration Test Script for Blockchain Service
 * Tests API endpoints for integration with other modules (Geofence, AI Engine, etc.)
 */

const axios = require('axios');
const { sampleTourists, sampleIncidents, sampleRegions, testScenarios } = require('./sample-data');

const BASE_URL = process.env.BLOCKCHAIN_API_URL || 'http://localhost:3001';
const TIMEOUT = 30000; // 30 seconds

class BlockchainIntegrationTester {
    constructor() {
        this.baseURL = BASE_URL;
        this.registeredTourists = [];
        this.loggedIncidents = [];
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Blockchain Service Integration Tests...\n');
        console.log(`Base URL: ${this.baseURL}\n`);

        try {
            // Test service health
            await this.testHealthCheck();
            
            // Test tourist registration flow
            await this.testTouristRegistrationFlow();
            
            // Test incident logging flow
            await this.testIncidentLoggingFlow();
            
            // Test integration scenarios
            await this.testIntegrationScenarios();
            
            // Test API performance
            await this.testPerformance();
            
            // Generate summary report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Critical error during testing:', error.message);
            process.exit(1);
        }
    }

    async testHealthCheck() {
        console.log('📋 Testing Health Check...');
        
        try {
            const response = await axios.get(`${this.baseURL}/health`, { timeout: TIMEOUT });
            
            if (response.status === 200 && response.data.status === 'healthy') {
                this.logSuccess('Health check passed');
            } else {
                this.logError('Health check failed', response.data);
            }
        } catch (error) {
            this.logError('Health check request failed', error.message);
        }
    }

    async testTouristRegistrationFlow() {
        console.log('\n👤 Testing Tourist Registration Flow...');
        
        try {
            // Test registering multiple tourists
            for (let i = 0; i < 3; i++) {
                const tourist = sampleTourists[i];
                const response = await axios.post(
                    `${this.baseURL}/blockchain/registerDeID`,
                    tourist,
                    { timeout: TIMEOUT }
                );
                
                if (response.status === 201 && response.data.success) {
                    this.registeredTourists.push({
                        ...tourist,
                        touristId: response.data.data.touristId,
                        publicKey: response.data.data.publicKey
                    });
                    this.logSuccess(`Tourist registered: ${tourist.name} -> ${response.data.data.touristId}`);
                } else {
                    this.logError(`Failed to register tourist: ${tourist.name}`, response.data);
                }
            }
            
            // Test retrieving tourist information
            if (this.registeredTourists.length > 0) {
                const touristId = this.registeredTourists[0].touristId;
                const response = await axios.get(`${this.baseURL}/blockchain/deid/${touristId}`, { timeout: TIMEOUT });
                
                if (response.status === 200 && response.data.success) {
                    this.logSuccess(`Tourist info retrieved: ${touristId}`);
                } else {
                    this.logError(`Failed to retrieve tourist info: ${touristId}`, response.data);
                }
            }
            
        } catch (error) {
            this.logError('Tourist registration flow failed', error.message);
        }
    }

    async testIncidentLoggingFlow() {
        console.log('\n📢 Testing Incident Logging Flow...');
        
        if (this.registeredTourists.length === 0) {
            this.logError('No registered tourists available for incident testing');
            return;
        }
        
        try {
            // Test logging different types of incidents
            const incidentTypes = ['breach', 'anomaly', 'sos', 'alert'];
            
            for (let i = 0; i < incidentTypes.length; i++) {
                const incident = {
                    ...sampleIncidents[i],
                    touristId: this.registeredTourists[i % this.registeredTourists.length].touristId,
                    eventType: incidentTypes[i]
                };
                
                const response = await axios.post(
                    `${this.baseURL}/blockchain/logIncident`,
                    incident,
                    { timeout: TIMEOUT }
                );
                
                if (response.status === 201 && response.data.success) {
                    this.loggedIncidents.push({
                        ...incident,
                        incidentId: response.data.data.incidentId
                    });
                    this.logSuccess(`Incident logged: ${incident.eventType} -> ${response.data.data.incidentId}`);
                } else {
                    this.logError(`Failed to log incident: ${incident.eventType}`, response.data);
                }
            }
            
            // Test querying incidents
            if (this.loggedIncidents.length > 0) {
                await this.testIncidentQueries();
            }
            
        } catch (error) {
            this.logError('Incident logging flow failed', error.message);
        }
    }

    async testIncidentQueries() {
        console.log('\n🔍 Testing Incident Queries...');
        
        try {
            // Query incidents by tourist
            const touristId = this.registeredTourists[0].touristId;
            const touristResponse = await axios.get(
                `${this.baseURL}/blockchain/incidents?touristId=${touristId}`,
                { timeout: TIMEOUT }
            );
            
            if (touristResponse.status === 200 && touristResponse.data.success) {
                this.logSuccess(`Tourist incidents queried: ${touristResponse.data.count} incidents found`);
            } else {
                this.logError('Failed to query tourist incidents', touristResponse.data);
            }
            
            // Query incidents by region
            const region = sampleRegions[0];
            const regionResponse = await axios.get(
                `${this.baseURL}/blockchain/incidents?region=${encodeURIComponent(JSON.stringify(region))}`,
                { timeout: TIMEOUT }
            );
            
            if (regionResponse.status === 200 && regionResponse.data.success) {
                this.logSuccess(`Regional incidents queried: ${regionResponse.data.count} incidents found`);
            } else {
                this.logError('Failed to query regional incidents', regionResponse.data);
            }
            
            // Get incident statistics
            const statsResponse = await axios.get(
                `${this.baseURL}/blockchain/incidents/statistics`,
                { timeout: TIMEOUT }
            );
            
            if (statsResponse.status === 200 && statsResponse.data.success) {
                this.logSuccess(`Statistics retrieved: ${statsResponse.data.data.totalIncidents} total incidents`);
            } else {
                this.logError('Failed to get incident statistics', statsResponse.data);
            }
            
        } catch (error) {
            this.logError('Incident queries failed', error.message);
        }
    }

    async testIntegrationScenarios() {
        console.log('\n🔗 Testing Integration Scenarios...');
        
        // Scenario 1: Geofence Backend Integration
        await this.testGeofenceIntegration();
        
        // Scenario 2: AI Engine Integration
        await this.testAIEngineIntegration();
        
        // Scenario 3: Alert System Integration
        await this.testAlertSystemIntegration();
    }

    async testGeofenceIntegration() {
        console.log('\n🏢 Testing Geofence Backend Integration...');
        
        try {
            // Simulate geofence breach detection
            if (this.registeredTourists.length > 0) {
                const breachIncident = {
                    touristId: this.registeredTourists[0].touristId,
                    eventType: 'breach',
                    location: {
                        latitude: 28.6139,
                        longitude: 77.2090,
                        address: 'Red Fort, Delhi, India',
                        geofenceId: 'HISTORICAL_MONUMENT_001'
                    },
                    severity: 'high',
                    description: 'Tourist entered restricted archaeological area',
                    reportedBy: 'geofence-backend',
                    metadata: {
                        polygonId: 'red_fort_restricted',
                        breachTime: new Date().toISOString(),
                        confidence: 1.0
                    }
                };
                
                const response = await axios.post(
                    `${this.baseURL}/blockchain/logIncident`,
                    breachIncident,
                    { timeout: TIMEOUT }
                );
                
                if (response.status === 201 && response.data.success) {
                    this.logSuccess('Geofence breach incident logged successfully');
                    
                    // Test updating incident status (authority response)
                    const incidentId = response.data.data.incidentId;
                    const updateResponse = await axios.put(
                        `${this.baseURL}/blockchain/incidents/${incidentId}`,
                        {
                            status: 'in-progress',
                            responderId: 'AUTH_DELHI_001',
                            resolutionNotes: 'Security team dispatched'
                        },
                        { timeout: TIMEOUT }
                    );
                    
                    if (updateResponse.status === 200) {
                        this.logSuccess('Incident status updated by authority');
                    }
                }
            }
        } catch (error) {
            this.logError('Geofence integration test failed', error.message);
        }
    }

    async testAIEngineIntegration() {
        console.log('\n🤖 Testing AI Engine Integration...');
        
        try {
            // Simulate AI anomaly detection
            if (this.registeredTourists.length > 0) {
                const anomalyIncident = {
                    touristId: this.registeredTourists[0].touristId,
                    eventType: 'anomaly',
                    location: {
                        latitude: 19.0760,
                        longitude: 72.8777,
                        address: 'Gateway of India, Mumbai, India'
                    },
                    severity: 'medium',
                    description: 'Unusual movement pattern detected',
                    reportedBy: 'ai-engine',
                    metadata: {
                        algorithm: 'isolation_forest',
                        anomalyScore: 0.85,
                        confidence: 0.92,
                        patternType: 'stationary_extended'
                    }
                };
                
                const response = await axios.post(
                    `${this.baseURL}/blockchain/logIncident`,
                    anomalyIncident,
                    { timeout: TIMEOUT }
                );
                
                if (response.status === 201 && response.data.success) {
                    this.logSuccess('AI anomaly incident logged successfully');
                }
            }
        } catch (error) {
            this.logError('AI Engine integration test failed', error.message);
        }
    }

    async testAlertSystemIntegration() {
        console.log('\n📱 Testing Alert System Integration...');
        
        try {
            // Simulate SOS alert
            if (this.registeredTourists.length > 0) {
                const sosIncident = {
                    touristId: this.registeredTourists[0].touristId,
                    eventType: 'sos',
                    location: {
                        latitude: 27.1751,
                        longitude: 78.0421,
                        address: 'Taj Mahal, Agra, India'
                    },
                    severity: 'critical',
                    description: 'Emergency SOS alert triggered',
                    reportedBy: 'tourist',
                    metadata: {
                        triggerMethod: 'mobile_app_panic_button',
                        deviceId: 'PHONE_12345',
                        batteryLevel: 35
                    }
                };
                
                const response = await axios.post(
                    `${this.baseURL}/blockchain/logIncident`,
                    sosIncident,
                    { timeout: TIMEOUT }
                );
                
                if (response.status === 201 && response.data.success) {
                    this.logSuccess('SOS alert incident logged successfully');
                    
                    // Simulate emergency response logging
                    const responseIncident = {
                        touristId: this.registeredTourists[0].touristId,
                        eventType: 'response',
                        location: sosIncident.location,
                        severity: 'high',
                        description: 'Emergency response team dispatched',
                        reportedBy: 'emergency-services',
                        metadata: {
                            responseTeamId: 'EMR_AGRA_001',
                            estimatedArrival: '8 minutes',
                            relatedIncidentId: response.data.data.incidentId
                        }
                    };
                    
                    const responseLogResult = await axios.post(
                        `${this.baseURL}/blockchain/logIncident`,
                        responseIncident,
                        { timeout: TIMEOUT }
                    );
                    
                    if (responseLogResult.status === 201) {
                        this.logSuccess('Emergency response logged successfully');
                    }
                }
            }
        } catch (error) {
            this.logError('Alert System integration test failed', error.message);
        }
    }

    async testPerformance() {
        console.log('\n⚡ Testing API Performance...');
        
        try {
            // Test concurrent tourist registrations
            const startTime = Date.now();
            const concurrentRegistrations = [];
            
            for (let i = 0; i < 10; i++) {
                const tourist = {
                    ...sampleTourists[i % sampleTourists.length],
                    name: `Perf Test Tourist ${i}`,
                    phoneNumber: `+1-555-888-${i.toString().padStart(4, '0')}`
                };
                
                concurrentRegistrations.push(
                    axios.post(`${this.baseURL}/blockchain/registerDeID`, tourist, { timeout: TIMEOUT })
                );
            }
            
            const results = await Promise.allSettled(concurrentRegistrations);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201).length;
            
            this.logSuccess(`Performance test: ${successful}/10 registrations completed in ${duration}ms`);
            
            if (duration > 15000) { // 15 seconds
                this.logError('Performance test warning: Operations took longer than expected', `${duration}ms`);
            }
            
        } catch (error) {
            this.logError('Performance test failed', error.message);
        }
    }

    logSuccess(message) {
        console.log(`✅ ${message}`);
        this.testResults.passed++;
    }

    logError(message, details = null) {
        console.log(`❌ ${message}`);
        if (details) {
            console.log(`   Details: ${typeof details === 'object' ? JSON.stringify(details, null, 2) : details}`);
        }
        this.testResults.failed++;
        this.testResults.errors.push({ message, details });
    }

    generateReport() {
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.message}`);
            });
        }
        
        console.log('\n🎯 Integration Summary:');
        console.log(`📤 Registered Tourists: ${this.registeredTourists.length}`);
        console.log(`📥 Logged Incidents: ${this.loggedIncidents.length}`);
        
        if (this.registeredTourists.length > 0) {
            console.log('\n👥 Sample Tourist IDs:');
            this.registeredTourists.slice(0, 3).forEach(tourist => {
                console.log(`   ${tourist.name}: ${tourist.touristId}`);
            });
        }
        
        console.log('\n🚀 Integration test completed!');
        
        // Exit with appropriate code
        process.exit(this.testResults.failed > 0 ? 1 : 0);
    }
}

// Run the integration tests
if (require.main === module) {
    const tester = new BlockchainIntegrationTester();
    tester.runAllTests().catch(error => {
        console.error('Integration test runner failed:', error);
        process.exit(1);
    });
}

module.exports = BlockchainIntegrationTester;