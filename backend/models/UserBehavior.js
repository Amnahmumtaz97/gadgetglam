const mongoose = require('mongoose');

const UserBehaviorSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  session_id: { type: String, index: true },
  viewed_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  clicked_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  recommended_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  search_queries: [{ type: String }],
  last_cart_activity: { type: Date },
  checkout_started_at: { type: Date }
}, { timestamps: true });

UserBehaviorSchema.index({ user_id: 1, session_id: 1 });

module.exports = mongoose.model('UserBehavior', UserBehaviorSchema);
