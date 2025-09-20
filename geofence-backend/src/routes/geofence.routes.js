const express = require('express');
const geofenceController = require('../controllers/geofence.controller');

const router = express.Router();

/**
 * @swagger
 * /geofence/create:
 *   post:
 *     summary: Create a new geofence polygon
 *     tags: [Geofences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - polygon
 *               - zoneType
 *               - severity
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the geofence
 *               description:
 *                 type: string
 *                 description: Description of the geofence
 *               polygon:
 *                 type: object
 *                 description: GeoJSON Polygon
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Polygon]
 *                   coordinates:
 *                     type: array
 *                     description: Array of array of coordinates [lng, lat]
 *               zoneType:
 *                 type: string
 *                 enum: [danger, caution, safe]
 *                 description: Type of zone
 *               severity:
 *                 type: string
 *                 enum: [high, medium, low]
 *                 description: Severity level
 *               createdBy:
 *                 type: string
 *                 description: ID of authority creating the geofence
 *     responses:
 *       201:
 *         description: Geofence created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/create', geofenceController.createGeofence);

/**
 * @swagger
 * /geofence/all:
 *   get:
 *     summary: Get all active geofences
 *     tags: [Geofences]
 *     responses:
 *       200:
 *         description: List of all geofences
 *       500:
 *         description: Server error
 */
router.get('/all', geofenceController.getAllGeofences);

/**
 * @swagger
 * /geofence/delete_all:
 *   post:
 *     summary: Delete all persisted geofences (dangerous)
 *     tags: [Geofences]
 *     responses:
 *       200:
 *         description: All geofences deleted
 *       500:
 *         description: Server error
 */
router.post('/delete_all', geofenceController.deleteAllGeofences);



/* Reordered: dynamic '/:id' routes are appended after specific routes (/check, /bulkCheck, /breaches) to avoid shadowing */

/**
 * @swagger
 * /geofence/check:
 *   post:
 *     summary: Check if coordinates are inside any geofence
 *     tags: [Geofences]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - touristId
 *               - coords
 *             properties:
 *               touristId:
 *                 type: string
 *                 description: ID of the tourist
 *               coords:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     description: Latitude
 *                   lng:
 *                     type: number
 *                     description: Longitude
 *     responses:
 *       200:
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     breach:
 *                       type: boolean
 *                     geofence:
 *                       type: object
 *                       description: Present only if breach is true
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/check', geofenceController.checkGeofence);

/**
 * @swagger
 * /geofence/bulkCheck:
 *   post:
 *     summary: Check multiple coordinates against geofences
 *     tags: [Geofences]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - checkRequests
 *             properties:
 *               checkRequests:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - touristId
 *                     - coords
 *                   properties:
 *                     touristId:
 *                       type: string
 *                     coords:
 *                       type: object
 *                       required:
 *                         - lat
 *                         - lng
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *     responses:
 *       200:
 *         description: Bulk check results
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/bulkCheck', geofenceController.bulkCheckGeofence);

/**
 * @swagger
 * /geofence/breaches:
 *   get:
 *     summary: Get all recorded breach events
 *     tags: [Geofences]
 *     responses:
 *       200:
 *         description: List of breach events
 *       500:
 *         description: Server error
 */
router.get('/breaches', geofenceController.getBreachEvents);

/**
 * @swagger
 * /geofence/breaches/{id}:
 *   patch:
 *     summary: Update breach event status or fields
 *     tags: [Geofences]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Breach event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, acknowledged, resolved]
 *               forwardedToBlockchain:
 *                 type: boolean
 *               alertSent:
 *                 type: boolean
 *               processed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Breach event updated
 *       404:
 *         description: Breach event not found
 *       500:
 *         description: Server error
 */
router.patch('/breaches/:id', geofenceController.updateBreachStatus);

/**
 * @swagger
 * /geofence/{id}:
 *   get:
 *     summary: Get a specific geofence by ID
 *     tags: [Geofences]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Geofence ID
 *     responses:
 *       200:
 *         description: Geofence data
 *       404:
 *         description: Geofence not found
 *       500:
 *         description: Server error
 */
router.get('/:id', geofenceController.getGeofence);

/**
 * @swagger
 * /geofence/{id}:
 *   put:
 *     summary: Update an existing geofence
 *     tags: [Geofences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Geofence ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               polygon:
 *                 type: object
 *               zoneType:
 *                 type: string
 *                 enum: [danger, caution, safe]
 *               severity:
 *                 type: string
 *                 enum: [high, medium, low]
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Geofence updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Geofence not found
 *       500:
 *         description: Server error
 */
router.put('/:id', geofenceController.updateGeofence);

/**
 * @swagger
 * /geofence/{id}:
 *   delete:
 *     summary: Delete a geofence (soft delete)
 *     tags: [Geofences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Geofence ID
 *     responses:
 *       204:
 *         description: Geofence deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Geofence not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', geofenceController.deleteGeofence);

module.exports = router;