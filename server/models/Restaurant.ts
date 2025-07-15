import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  website: {
    type: String,
    required: false
  },
  qrCode: {
    type: String,
    required: false
  },
  mongoUri: {
    type: String,
    required: false
  },
  customTypes: {
    type: [String],
    default: []
  },
  customAttributes: {
    type: Map,
    of: String,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export type RestaurantType = mongoose.InferSchemaType<typeof restaurantSchema>;