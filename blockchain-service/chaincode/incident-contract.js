'use strict';

const { Contract } = require('fabric-contract-api');

class IncidentLogContract extends Contract {

    // Initialize the chaincode
    async initLedger(ctx) {
        console.info('============= START : Initialize IncidentLog Ledger ===========');
        
        const initData = {
            contractVersion: '1.0.0',
            initialized: true,
            timestamp: new Date().toISOString(),
            totalIncidents: 0
        };
        
        await ctx.stub.putState('INIT_INCIDENT', Buffer.from(JSON.stringify(initData)));
        console.info('============= END : Initialize IncidentLog Ledger ===========');
    }

    // Log a new safety incident
    async logIncident(ctx, incidentData) {
        console.info('============= START : Log Safety Incident ===========');
        
        try {
            const data = JSON.parse(incidentData);
            
            // Validate required fields
            this._validateIncidentData(data);
            
            // Generate unique incident ID
            const incidentId = this._generateIncidentId();
            
            // Create incident record
            const incident = {
                incidentId: incidentId,
                touristId: data.touristId,
                eventType: data.eventType, // breach, anomaly, sos, response, resolved
                location: {
                    latitude: parseFloat(data.location.latitude),
                    longitude: parseFloat(data.location.longitude),
                    address: data.location.address || '',
                    geofenceId: data.location.geofenceId || ''
                },
                timestamp: new Date().toISOString(),
                severity: data.severity || 'medium', // low, medium, high, critical
                description: data.description || '',
                metadata: data.metadata || {},
                reportedBy: data.reportedBy || 'system', // system, tourist, authority
                status: 'open', // open, in-progress, resolved, closed
                responseTime: null,
                responderId: null,
                resolutionNotes: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Store the incident on the ledger
            await ctx.stub.putState(incidentId, Buffer.from(JSON.stringify(incident)));
            
            // Create composite keys for efficient querying
            await this._createIncidentIndexes(ctx, incident);
            
            // Update incident counter
            await this._incrementIncidentCounter(ctx);
            
            console.info(`Incident logged successfully: ${incidentId}`);
            
            return JSON.stringify({
                success: true,
                incidentId: incidentId,
                touristId: data.touristId,
                eventType: data.eventType,
                timestamp: incident.timestamp,
                message: 'Incident logged successfully'
            });

        } catch (error) {
            console.error(`Error logging incident: ${error.message}`);
            throw new Error(`Failed to log incident: ${error.message}`);
        }
    }

    // Get all incidents for a specific tourist
    async getIncidentsForTourist(ctx, touristId, limit = '50') {
        console.info(`============= START : Get Incidents for Tourist ${touristId} ===========`);
        
        try {
            const limitNum = parseInt(limit);
            const indexName = 'tourist~timestamp~incidentId';
            const iterator = await ctx.stub.getStateByPartialCompositeKey(indexName, [touristId]);
            
            const incidents = [];
            let result = await iterator.next();
            let count = 0;
            
            while (!result.done && count < limitNum) {
                const responseRange = result.value;
                const objectType = responseRange.key;
                const attributes = await ctx.stub.splitCompositeKey(objectType);
                const incidentId = attributes.attributes[2];
                
                // Get the actual incident data
                const incidentBytes = await ctx.stub.getState(incidentId);
                if (incidentBytes && incidentBytes.length > 0) {
                    const incident = JSON.parse(incidentBytes.toString());
                    incidents.push(incident);
                    count++;
                }
                
                result = await iterator.next();
            }
            
            await iterator.close();
            
            // Sort by timestamp (most recent first)
            incidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            console.info(`Found ${incidents.length} incidents for tourist: ${touristId}`);
            return JSON.stringify(incidents);

        } catch (error) {
            console.error(`Error getting incidents for tourist: ${error.message}`);
            throw new Error(`Failed to get incidents for tourist: ${error.message}`);
        }
    }

    // Get incidents by geographic region (polygon bounds)
    async getIncidentsByRegion(ctx, regionData, startDate = '', endDate = '') {
        console.info('============= START : Get Incidents by Region ===========');
        
        try {
            const region = JSON.parse(regionData);
            
            // Validate region data
            if (!region.bounds || !region.bounds.north || !region.bounds.south || 
                !region.bounds.east || !region.bounds.west) {
                throw new Error('Invalid region bounds. Must include north, south, east, west coordinates');
            }

            // Get all incidents and filter by geographic bounds
            const allIncidents = await this._getAllIncidents(ctx);
            const filteredIncidents = [];
            
            for (const incident of allIncidents) {
                const lat = incident.location.latitude;
                const lng = incident.location.longitude;
                
                // Check if incident is within bounds
                if (lat >= region.bounds.south && lat <= region.bounds.north &&
                    lng >= region.bounds.west && lng <= region.bounds.east) {
                    
                    // Apply date filter if provided
                    if (this._isWithinDateRange(incident.timestamp, startDate, endDate)) {
                        filteredIncidents.push(incident);
                    }
                }
            }
            
            // Sort by timestamp (most recent first)
            filteredIncidents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            console.info(`Found ${filteredIncidents.length} incidents in region`);
            return JSON.stringify(filteredIncidents);

        } catch (error) {
            console.error(`Error getting incidents by region: ${error.message}`);
            throw new Error(`Failed to get incidents by region: ${error.message}`);
        }
    }

    // Update incident status (for authorities)
    async updateIncidentStatus(ctx, incidentId, statusUpdate) {
        console.info(`============= START : Update Incident Status ${incidentId} ===========`);
        
        try {
            const updateData = JSON.parse(statusUpdate);
            
            const incidentBytes = await ctx.stub.getState(incidentId);
            if (!incidentBytes || incidentBytes.length === 0) {
                throw new Error(`Incident with ID ${incidentId} does not exist`);
            }

            const incident = JSON.parse(incidentBytes.toString());
            
            // Validate status
            const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
            if (updateData.status && !validStatuses.includes(updateData.status)) {
                throw new Error(`Invalid status: ${updateData.status}`);
            }

            // Update incident fields
            if (updateData.status) incident.status = updateData.status;
            if (updateData.responderId) incident.responderId = updateData.responderId;
            if (updateData.resolutionNotes) incident.resolutionNotes = updateData.resolutionNotes;
            if (updateData.status === 'in-progress' && !incident.responseTime) {
                incident.responseTime = new Date().toISOString();
            }
            
            incident.updatedAt = new Date().toISOString();

            await ctx.stub.putState(incidentId, Buffer.from(JSON.stringify(incident)));

            console.info(`Incident status updated successfully: ${incidentId} -> ${updateData.status}`);
            return JSON.stringify({
                success: true,
                incidentId: incidentId,
                newStatus: updateData.status,
                updatedAt: incident.updatedAt,
                message: 'Incident status updated successfully'
            });

        } catch (error) {
            console.error(`Error updating incident status: ${error.message}`);
            throw new Error(`Failed to update incident status: ${error.message}`);
        }
    }

    // Get incident statistics
    async getIncidentStatistics(ctx, startDate = '', endDate = '') {
        console.info('============= START : Get Incident Statistics ===========');
        
        try {
            const allIncidents = await this._getAllIncidents(ctx);
            
            // Filter by date range if provided
            const filteredIncidents = allIncidents.filter(incident => 
                this._isWithinDateRange(incident.timestamp, startDate, endDate)
            );
            
            // Calculate statistics
            const stats = {
                totalIncidents: filteredIncidents.length,
                byEventType: {},
                bySeverity: {},
                byStatus: {},
                averageResponseTime: 0,
                dateRange: {
                    from: startDate || 'all',
                    to: endDate || 'all'
                },
                generatedAt: new Date().toISOString()
            };
            
            // Count by categories
            filteredIncidents.forEach(incident => {
                // By event type
                stats.byEventType[incident.eventType] = (stats.byEventType[incident.eventType] || 0) + 1;
                
                // By severity
                stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
                
                // By status
                stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
            });
            
            // Calculate average response time for resolved incidents
            const resolvedIncidents = filteredIncidents.filter(i => i.responseTime);
            if (resolvedIncidents.length > 0) {
                const totalResponseTime = resolvedIncidents.reduce((sum, incident) => {
                    const responseTime = new Date(incident.responseTime) - new Date(incident.timestamp);
                    return sum + responseTime;
                }, 0);
                stats.averageResponseTime = Math.round(totalResponseTime / resolvedIncidents.length / 1000 / 60); // in minutes
            }
            
            console.info(`Generated statistics for ${filteredIncidents.length} incidents`);
            return JSON.stringify(stats);

        } catch (error) {
            console.error(`Error getting incident statistics: ${error.message}`);
            throw new Error(`Failed to get incident statistics: ${error.message}`);
        }
    }

    // Helper Methods

    _validateIncidentData(data) {
        const requiredFields = ['touristId', 'eventType', 'location'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate event type
        const validEventTypes = ['breach', 'anomaly', 'sos', 'response', 'resolved', 'alert'];
        if (!validEventTypes.includes(data.eventType)) {
            throw new Error(`Invalid event type: ${data.eventType}`);
        }

        // Validate location
        if (!data.location.latitude || !data.location.longitude) {
            throw new Error('Location must include latitude and longitude');
        }

        // Validate coordinates
        const lat = parseFloat(data.location.latitude);
        const lng = parseFloat(data.location.longitude);
        
        if (isNaN(lat) || lat < -90 || lat > 90) {
            throw new Error('Invalid latitude. Must be between -90 and 90');
        }
        
        if (isNaN(lng) || lng < -180 || lng > 180) {
            throw new Error('Invalid longitude. Must be between -180 and 180');
        }
    }

    async _createIncidentIndexes(ctx, incident) {
        // Index by tourist and timestamp
        const touristTimestampIndex = await ctx.stub.createCompositeKey(
            'tourist~timestamp~incidentId',
            [incident.touristId, incident.timestamp, incident.incidentId]
        );
        await ctx.stub.putState(touristTimestampIndex, Buffer.from('\u0000'));

        // Index by event type and timestamp
        const eventTypeIndex = await ctx.stub.createCompositeKey(
            'eventType~timestamp~incidentId',
            [incident.eventType, incident.timestamp, incident.incidentId]
        );
        await ctx.stub.putState(eventTypeIndex, Buffer.from('\u0000'));

        // Index by severity and timestamp
        const severityIndex = await ctx.stub.createCompositeKey(
            'severity~timestamp~incidentId',
            [incident.severity, incident.timestamp, incident.incidentId]
        );
        await ctx.stub.putState(severityIndex, Buffer.from('\u0000'));
    }

    async _getAllIncidents(ctx) {
        const startKey = '';
        const endKey = '';
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);

        const incidents = [];
        let result = await iterator.next();

        while (!result.done) {
            const responseRange = result.value;
            
            // Skip index entries and initialization data
            if (!responseRange.key.startsWith('INIT_') && 
                !responseRange.key.includes('~') && 
                responseRange.key.length > 10) {
                
                try {
                    const incident = JSON.parse(responseRange.value.toString());
                    if (incident.incidentId) {
                        incidents.push(incident);
                    }
                } catch (error) {
                    // Skip invalid entries
                }
            }
            
            result = await iterator.next();
        }

        await iterator.close();
        return incidents;
    }

    async _incrementIncidentCounter(ctx) {
        try {
            const counterBytes = await ctx.stub.getState('INCIDENT_COUNTER');
            let counter = 0;
            
            if (counterBytes && counterBytes.length > 0) {
                counter = parseInt(counterBytes.toString());
            }
            
            counter++;
            await ctx.stub.putState('INCIDENT_COUNTER', Buffer.from(counter.toString()));
        } catch (error) {
            console.warn('Failed to update incident counter:', error.message);
        }
    }

    _generateIncidentId() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8);
        return `INC_${timestamp}_${random}`.toUpperCase();
    }

    _isWithinDateRange(timestamp, startDate, endDate) {
        if (!startDate && !endDate) return true;
        
        const incidentDate = new Date(timestamp);
        
        if (startDate && incidentDate < new Date(startDate)) {
            return false;
        }
        
        if (endDate && incidentDate > new Date(endDate)) {
            return false;
        }
        
        return true;
    }
}

module.exports = IncidentLogContract;