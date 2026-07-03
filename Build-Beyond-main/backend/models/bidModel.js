const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  floorNumber: { type: Number, required: true },
  floorType: {
    type: String,
    enum: ['residential', 'commercial', 'parking', 'mechanical', 'other'],
    required: true,
  },
  floorArea: { type: Number, required: true, min: 0 },
  floorDescription: { type: String, trim: true },
  floorImage: { type: String, trim: true },
});

const companyBidSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  companyName: { type: String, required: true, trim: true },
  bidPrice: { type: Number, required: true, min: 0 },
  bidDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
});

const BidSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    projectName: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    customerPhone: { type: String, required: true, trim: true },
    projectAddress: { type: String, required: true, trim: true },
    projectLocation: { type: String, required: true, trim: true },
    totalArea: { type: Number, required: true, min: 0 },
    buildingType: {
      type: String,
      enum: ['residential', 'commercial', 'industrial', 'mixedUse', 'other'],
      required: true,
    },
    estimatedBudget: { type: Number, min: 0 },
    projectTimeline: { type: Number, min: 0 },
    totalFloors: { type: Number, required: true, min: 1 },
    floors: [floorSchema],
    specialRequirements: { type: String, trim: true },
    accessibilityNeeds: {
      type: String,
      enum: ['wheelchair', 'elevators', 'ramps', 'other', 'none', ''],
    },
    energyEfficiency: {
      type: String,
      enum: ['standard', 'leed', 'passive', 'netZero', 'other', ''],
    },
    siteFiles: [{ type: String, trim: true }],
    companyBids: [companyBidSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    winningBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'companyBids',
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'awarded', 'cancelled'],
      default: 'open',
    },
    paymentDetails: {
      totalAmount: { type: Number },
      platformFee: { type: Number },
      amountPaidToCompany: { type: Number, default: 0 },
      paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'partially_paid', 'completed'],
        default: 'unpaid',
      },
      stripeSessionId: { type: String },
      payouts: [
        {
          amount: { type: Number, required: true },
          status: { type: String, enum: ['pending', 'released'], default: 'pending' },
          releaseDate: { type: Date },
        },
      ],
    },
  },
  { timestamps: true }
);

BidSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

BidSchema.index({ customerId: 1, createdAt: -1 });
BidSchema.index({ status: 1, createdAt: -1 });
BidSchema.index({ projectName: 1 });
BidSchema.index({ 'companyBids.companyId': 1 });
BidSchema.index({ 'companyBids.companyId': 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.Bid || mongoose.model('Bid', BidSchema);
