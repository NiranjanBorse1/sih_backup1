const axios = require('axios');

// Define a test geofence (danger zone in a hypothetical tourist area)
const testGeofence = {
  name: "Test Danger Zone",
  description: "A restricted area for testing the geofence system",
  polygon: {
    type: "Polygon",
    coordinates: [
      [
        [77.2090, 28.6139], // New Delhi area coordinates
        [77.2290, 28.6139],
        [77.2290, 28.6339],
        [77.2090, 28.6339],
        [77.2090, 28.6139]  // Close the polygon with the first point
      ]
    ]
  },
  zoneType: "danger",
  severity: "high",
  createdBy: "test-authority"
};

// Create the geofence
async function createGeofence() {
  try {
    const response = await axios.post('http://localhost:3002/geofence/create', testGeofence);
    console.log('Geofence created successfully:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error creating geofence:');
    console.error(error.response ? error.response.data : error.message);
  }
}

// Test checking if a point is inside the geofence
async function checkPoint(touristId, lat, lng) {
  try {
    const response = await axios.post('http://localhost:3002/geofence/check', {
      touristId,
      coords: { lat, lng }
    });
    console.log(`Check result for tourist ${touristId} at [${lat}, ${lng}]:`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error checking point:');
    console.error(error.response ? error.response.data : error.message);
  }
}

// Run the tests
async function runTests() {
  await createGeofence();
  
  // Test a point inside the geofence
  await checkPoint('tourist-1', 28.6200, 28.6200);
  
  // Test a point outside the geofence
  await checkPoint('tourist-2', 28.7000, 77.3000);
}

runTests();