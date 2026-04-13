/*********************************************************************************************************
*	Availability Routes: API endpoints for managing provider availability
*   Author: MosalaPro Development Team
*	Date: 2025-01-20
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const express = require('express');
const router = express.Router();
const AvailabilityModel = require('../models/availability');
const UserModel = require('../models/user');

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, error: 'Not authenticated' });
}

// Middleware to check if user is a provider
function isProvider(req, res, next) {
    if (req.user && req.user.registeredAsPro) {
        return next();
    }
    res.status(403).json({ success: false, error: 'Only providers can manage availability' });
}

// GET /api/availability/provider/:providerId - Get provider's availability
router.get('/provider/:providerId', async (req, res) => {
    try {
        const { providerId } = req.params;
        const { startDate, endDate, type } = req.query;

        let query = { providerId, isAvailable: true };

        if (type) {
            query.type = type;
        }

        // If date range is specified, get specific dates and recurring schedule
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            query.$or = [
                { type: 'recurring' }, // Get all recurring schedules
                {
                    type: 'specific',
                    date: { $gte: start, $lte: end }
                }
            ];
        }

        const availabilities = await AvailabilityModel.find(query)
            .sort({ dayOfWeek: 1, startTime: 1, date: 1 })
            .exec();

        res.json({ success: true, availabilities });
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/availability/my - Get current provider's availability
router.get('/my', isAuthenticated, isProvider, async (req, res) => {
    try {
        const availabilities = await AvailabilityModel.find({
            providerId: req.user._id
        })
        .sort({ type: 1, dayOfWeek: 1, date: 1, startTime: 1 })
        .exec();

        res.json({ success: true, availabilities });
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/availability - Create new availability slot
router.post('/', isAuthenticated, isProvider, async (req, res) => {
    try {
        const { type, dayOfWeek, date, startTime, endTime, timezone, note } = req.body;

        // Validation
        if (!type || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'type, startTime, and endTime are required'
            });
        }

        if (type === 'recurring' && dayOfWeek == null) {
            return res.status(400).json({
                success: false,
                error: 'dayOfWeek is required for recurring availability'
            });
        }

        if (type === 'specific' && !date) {
            return res.status(400).json({
                success: false,
                error: 'date is required for specific availability'
            });
        }

        const availability = new AvailabilityModel({
            providerId: req.user._id,
            type,
            dayOfWeek: type === 'recurring' ? dayOfWeek : undefined,
            date: type === 'specific' ? new Date(date) : undefined,
            startTime,
            endTime,
            timezone: timezone || req.user.address || 'UTC',
            note,
            isAvailable: true
        });

        await availability.save();

        res.json({
            success: true,
            message: 'Availability added successfully',
            availability
        });
    } catch (error) {
        console.error('Error creating availability:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/availability/:id - Update availability slot
router.put('/:id', isAuthenticated, isProvider, async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime, endTime, isAvailable, note } = req.body;

        const availability = await AvailabilityModel.findOne({
            _id: id,
            providerId: req.user._id
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                error: 'Availability slot not found'
            });
        }

        // Update fields
        if (startTime) availability.startTime = startTime;
        if (endTime) availability.endTime = endTime;
        if (isAvailable !== undefined) availability.isAvailable = isAvailable;
        if (note !== undefined) availability.note = note;

        await availability.save();

        res.json({
            success: true,
            message: 'Availability updated successfully',
            availability
        });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/availability/:id - Delete availability slot
router.delete('/:id', isAuthenticated, isProvider, async (req, res) => {
    try {
        const { id } = req.params;

        const availability = await AvailabilityModel.findOneAndDelete({
            _id: id,
            providerId: req.user._id
        });

        if (!availability) {
            return res.status(404).json({
                success: false,
                error: 'Availability slot not found'
            });
        }

        res.json({
            success: true,
            message: 'Availability deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting availability:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/availability/bulk - Create multiple availability slots at once
router.post('/bulk', isAuthenticated, isProvider, async (req, res) => {
    try {
        const { schedule } = req.body; // Array of availability objects

        if (!Array.isArray(schedule) || schedule.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'schedule must be a non-empty array'
            });
        }

        const availabilities = schedule.map(slot => ({
            providerId: req.user._id,
            type: slot.type,
            dayOfWeek: slot.dayOfWeek,
            date: slot.date ? new Date(slot.date) : undefined,
            startTime: slot.startTime,
            endTime: slot.endTime,
            timezone: slot.timezone || req.user.address || 'UTC',
            note: slot.note,
            isAvailable: true
        }));

        const created = await AvailabilityModel.insertMany(availabilities);

        res.json({
            success: true,
            message: `${created.length} availability slots created successfully`,
            availabilities: created
        });
    } catch (error) {
        console.error('Error creating bulk availability:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/availability/check - Check if a specific time slot is available
router.get('/check', async (req, res) => {
    try {
        const { providerId, date, startTime, endTime } = req.query;

        if (!providerId || !date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'providerId, date, startTime, and endTime are required'
            });
        }

        const requestedDate = new Date(date);
        const dayOfWeek = requestedDate.getDay();

        // Check for conflicts with existing bookings or blocked times
        const conflicts = await AvailabilityModel.find({
            providerId,
            $or: [
                // Specific date booking
                {
                    type: 'specific',
                    date: requestedDate,
                    isAvailable: false,
                    $or: [
                        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
                        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
                        { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
                    ]
                }
            ]
        });

        // Check if provider has availability for this day/time
        const hasAvailability = await AvailabilityModel.findOne({
            providerId,
            isAvailable: true,
            $or: [
                // Recurring availability for this day of week
                {
                    type: 'recurring',
                    dayOfWeek,
                    startTime: { $lte: startTime },
                    endTime: { $gte: endTime }
                },
                // Specific date availability
                {
                    type: 'specific',
                    date: requestedDate,
                    startTime: { $lte: startTime },
                    endTime: { $gte: endTime }
                }
            ]
        });

        const isAvailable = hasAvailability && conflicts.length === 0;

        res.json({
            success: true,
            isAvailable,
            message: isAvailable
                ? 'Time slot is available'
                : 'Time slot is not available'
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
