const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    reminderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reminder',
      required: [true, 'Reminder ID is required'],
      index: true
    },
    externalCallId: {
      type: String,
      required: [true, 'External call ID is required'],
      index: true
    },
    provider: {
      type: String,
      required: [true, 'Provider is required'],
      enum: {
        values: ['twilio', 'vapi'],
        message: '{VALUE} is not a valid provider'
      }
    },
    status: {
      type: String,
      required: [true, 'Status is required']
    },
    transcript: {
      type: String,
      default: null
    },
    receivedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

callLogSchema.index({ externalCallId: 1, provider: 1 }, { unique: true });

const CallLog = mongoose.model('CallLog', callLogSchema);

module.exports = CallLog;
