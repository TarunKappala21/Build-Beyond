const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    location: { type: String, required: true, trim: true },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Please enter a valid LinkedIn URL'],
      default: null,
    },
    experience: { type: Number, required: true, min: 0 },
    expectedSalary: { type: Number, required: true, min: 0 },
    positionApplying: { type: String, required: true, trim: true },
    primarySkills: {
      type: [String],
      required: true,
      validate: {
        validator: function (array) {
          return array.length > 0;
        },
        message: 'At least one primary skill is required',
      },
    },
    workExperience: { type: String, required: true, trim: true },
    resume: { type: String, required: true, trim: true },
    termsAgree: { type: Boolean, required: true, enum: [true] },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    compName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Denied'], default: 'Pending' },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ workerId: 1, createdAt: -1 });
jobApplicationSchema.index({ companyId: 1, createdAt: -1 });
jobApplicationSchema.index({ status: 1, createdAt: -1 });
jobApplicationSchema.index({ companyId: 1, status: 1, createdAt: -1 });
jobApplicationSchema.index({ workerId: 1, status: 1, createdAt: -1 });
jobApplicationSchema.index({ workerId: 1, companyId: 1, status: 1 });

module.exports =
  mongoose.models.WorkerToCompany ||
  mongoose.model('WorkerToCompany', jobApplicationSchema);
