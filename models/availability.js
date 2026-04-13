/*********************************************************************************************************
*	Availability Model: Manages service provider availability schedules
*   Author: MosalaPro Development Team
*	Date: 2025-01-20
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  // Provider reference
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Availability type: 'recurring' or 'specific'
  type: {
    type: String,
    enum: ['recurring', 'specific'],
    default: 'recurring',
    required: true
  },

  // For recurring availability (weekly schedule)
  dayOfWeek: {
    type: Number, // 0=Sunday, 1=Monday, ..., 6=Saturday
    min: 0,
    max: 6
  },

  // For specific date availability
  date: {
    type: Date
  },

  // Time slots (24-hour format)
  startTime: {
    type: String, // Format: "HH:MM" (e.g., "09:00")
    required: true
  },

  endTime: {
    type: String, // Format: "HH:MM" (e.g., "17:00")
    required: true
  },

  // Timezone
  timezone: {
    type: String,
    default: "UTC"
  },

  // Whether this slot is available or blocked
  isAvailable: {
    type: Boolean,
    default: true
  },

  // Optional note for this availability slot
  note: {
    type: String,
    maxLength: 200
  },

  // Booking reference (if slot is booked)
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  lastUpdate: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
availabilitySchema.index({ providerId: 1, type: 1, dayOfWeek: 1 });
availabilitySchema.index({ providerId: 1, date: 1 });
availabilitySchema.index({ providerId: 1, isAvailable: 1 });

// Validation: ensure either dayOfWeek (recurring) or date (specific) is set
availabilitySchema.pre('save', function(next) {
  if (this.type === 'recurring' && this.dayOfWeek == null) {
    return next(new Error('dayOfWeek is required for recurring availability'));
  }
  if (this.type === 'specific' && !this.date) {
    return next(new Error('date is required for specific availability'));
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(this.startTime)) {
    return next(new Error('startTime must be in HH:MM format'));
  }
  if (!timeRegex.test(this.endTime)) {
    return next(new Error('endTime must be in HH:MM format'));
  }

  // Validate that endTime is after startTime
  const start = this.startTime.split(':').map(Number);
  const end = this.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];

  if (endMinutes <= startMinutes) {
    return next(new Error('endTime must be after startTime'));
  }

  this.lastUpdate = new Date();
  next();
});

const AvailabilityModel = mongoose.model("Availability", availabilitySchema);

module.exports = AvailabilityModel;
