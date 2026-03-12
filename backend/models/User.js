const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const UserSchema = new mongoose.Schema({
  first_name: { type: String, required: true, trim: true },
  last_name:  { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true, lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password:   { type: String, required: true, minlength: 6, select: false },
  avatar:     { type: String, default: '' },
  role:       { type: String, enum: ['user', 'admin'], default: 'user' },
  is_active:  { type: Boolean, default: true },

  shipping_address: {
    street: String, city: String, country: String, zip: String
  },

  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  password_reset_token:   String,
  password_reset_expires: Date,

}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);
