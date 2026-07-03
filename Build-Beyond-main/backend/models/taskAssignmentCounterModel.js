const mongoose = require('mongoose');

const taskAssignmentCounterSchema = new mongoose.Schema({
  lastAssignedIndex: { type: Number, default: -1 },
  type: { type: String, enum: ['verification', 'complaint'], required: true, unique: true },
});

module.exports =
  mongoose.models.TaskAssignmentCounter ||
  mongoose.model('TaskAssignmentCounter', taskAssignmentCounterSchema);
