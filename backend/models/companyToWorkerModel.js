const mongoose = require('mongoose');

const companyToWorkerSchema = new mongoose.Schema({
  position: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: Number, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  status: { type: String, enum: ['Pending', 'Accepted', 'Denied'], default: 'Pending' },
});

companyToWorkerSchema.index({ company: 1 });
companyToWorkerSchema.index({ worker: 1 });
companyToWorkerSchema.index({ status: 1 });
companyToWorkerSchema.index({ company: 1, status: 1 });
companyToWorkerSchema.index({ worker: 1, status: 1 });
companyToWorkerSchema.index({ company: 1, worker: 1, status: 1 });

module.exports =
  mongoose.models.CompanytoWorker ||
  mongoose.model('CompanytoWorker', companyToWorkerSchema);
