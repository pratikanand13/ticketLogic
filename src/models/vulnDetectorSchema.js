const mongoose = require('mongoose');

// Define the schema
const vulnDetectorSchema = new mongoose.Schema({
  description: {
    type: Map,
    of: String,
    required: true
  },
  ticketId: {
    type: Number,
    required: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedTicketId: {
    type: Number,
    default: null
  }
}, { 
  timestamps: true 
});

// Create the model
const VulnDetector = mongoose.model('VulnDetector', vulnDetectorSchema);

module.exports = VulnDetector;
