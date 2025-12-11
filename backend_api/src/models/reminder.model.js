const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [
        /^\+\d{8,15}$/,
        'Phone number must be in E.164 format (e.g., +1234567890)'
      ]
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled time is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'processing', 'called', 'failed'],
        message: '{VALUE} is not a valid status'
      },
      default: 'scheduled',
      index: true
    },
    twilioCallSid: {
      type: String,
      default: null,
      sparse: true // Only index non-null values
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);


// Compound index for worker queries (find due reminders with status 'scheduled')
reminderSchema.index({ status: 1, scheduledAt: 1 });

// Index for Twilio callback lookups
reminderSchema.index({ twilioCallSid: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;
