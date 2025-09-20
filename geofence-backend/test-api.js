const axios = require('axios');

// Base URL for the API
const API_URL = 'http://localhost:3002';

// Test creating a geofence
async function testCreateGeofence() {
  try {
    console.log('1. Testing geofence creation...');
    const geofenceData = {
      name: 'Demo Danger Zone',
      description: 'A dangerous area near tourist attraction',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [77.2090, 28.6139], // Example coordinates (Delhi area)
            [77.2290, 28.6139],
            [77.2290, 28.6339],
            [77.2090, 28.6339],
            [77.2090, 28.6139]  // Close the polygon
          ]
        ]
      },
      zoneType: 'danger',
      severity: 'high',
      createdBy: 'test-admin'
    };

    const response = await axios.post(`${API_URL}/geofence/create`, geofenceData);
    console.log('✅ Geofence created successfully!');
    console.log('Geofence ID:', response.data.data.geofence._id);
    return response.data.data.geofence._id;
  } catch (error) {
    console.error('❌ Failed to create geofence:');
    console.error(error.response?.data || error.message);
    return null;
  }
}

// Test getting all geofences
async function testGetAllGeofences() {
  try {
    console.log('\n2. Testing get all geofences...');
    const response = await axios.get(`${API_URL}/geofence/all`);
    console.log(`✅ Retrieved ${response.data.results} geofences!`);
    return response.data.data.geofences;
  } catch (error) {
    console.error('❌ Failed to get geofences:');
    console.error(error.response?.data || error.message);
    return [];
  }
}

// Test checking a point against geofences
async function testCheckPoint(inside = true) {
  try {
    console.log(`\n3. Testing point ${inside ? 'inside' : 'outside'} geofence...`);
    
    // Coordinates for testing (inside or outside the created geofence)
    const coords = inside 
      ? { lat: 28.6200, lng: 77.2200 }  // Inside the geofence
      : { lat: 28.7000, lng: 77.3000 };  // Outside the geofence

    const checkData = {
      touristId: 'test-tourist-123',
      coords: coords
    };

    const response = await axios.post(`${API_URL}/geofence/check`, checkData);
    console.log('✅ Check completed successfully!');
    console.log('Breach detected:', response.data.data.breach ? 'YES' : 'NO');
    if (response.data.data.breach) {
      console.log('Geofence details:', {
        name: response.data.data.geofence.name,
        zoneType: response.data.data.geofence.zoneType,
        severity: response.data.data.geofence.severity
      });
    }
    return response.data;
  } catch (error) {
    console.error('❌ Failed to check point:');
    console.error(error.response?.data || error.message);
    return null;
  }
}

// Test bulk checking multiple points
async function testBulkCheck() {
  try {
    console.log('\n4. Testing bulk check...');
    const bulkData = {
      checkRequests: [
        {
          touristId: 'tourist-1',
          coords: { lat: 28.6200, lng: 77.2200 }  // Inside
        },
        {
          touristId: 'tourist-2',
          coords: { lat: 28.7000, lng: 77.3000 }  // Outside
        }
      ]
    };

    const response = await axios.post(`${API_URL}/geofence/bulkCheck`, bulkData);
    console.log('✅ Bulk check completed successfully!');
    
    response.data.data.checkResults.forEach(result => {
      console.log(`Tourist ${result.touristId}: Breach detected: ${result.breach ? 'YES' : 'NO'}`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to perform bulk check:');
    console.error(error.response?.data || error.message);
    return null;
  }
}

// Run all tests in sequence
async function runAllTests() {
  console.log('=== TESTING GEOFENCE BACKEND API ===\n');
  
  // Create a geofence first
  const geofenceId = await testCreateGeofence();
  
  if (!geofenceId) {
    console.error('Cannot proceed with tests: Failed to create geofence');
    return;
  }
  
  // Get all geofences
  const geofences = await testGetAllGeofences();
  
  // Check points against geofences
  await testCheckPoint(true);  // Inside
  await testCheckPoint(false);  // Outside
  
  // Test bulk check
  await testBulkCheck();
  
  console.log('\n=== TESTS COMPLETED ===');
}

// Run the tests
runAllTests();