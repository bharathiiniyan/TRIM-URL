import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  longUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true, // sparse allow multiple null/undefined values but enforces uniqueness on defined values
    trim: true
  },
  clicksCount: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Url = mongoose.model('Url', urlSchema);
export default Url;
