const { Order } = require('../models/OrderReview');

const TRACK_SEQUENCE = ['Pending', 'Confirmed', 'Dispatched', 'Delivered'];
const STATUS_ALIAS = {
  Processing: 'Confirmed',
  Shipped: 'Dispatched',
};

function randomTrackingIntervalMs() {
  const minMs = 2 * 60 * 60 * 1000;
  const maxMs = 3 * 60 * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function normalizeStatus(status) {
  return STATUS_ALIAS[status] || status;
}

function nextTrackStatus(status) {
  const normalized = normalizeStatus(status);
  const idx = TRACK_SEQUENCE.indexOf(normalized);
  if (idx < 0 || idx >= TRACK_SEQUENCE.length - 1) return null;
  return TRACK_SEQUENCE[idx + 1];
}

async function runAutoTrackingTick() {
  const now = new Date();

  const candidates = await Order.find({
    auto_tracking_enabled: { $ne: false },
    order_status: { $in: ['Pending', 'Confirmed', 'Dispatched', 'Processing', 'Shipped'] },
    $or: [
      { next_auto_status_at: { $exists: false } },
      { next_auto_status_at: null },
      { next_auto_status_at: { $lte: now } },
    ],
  }).select('_id order_status createdAt status_updated_at next_auto_status_at');

  for (const order of candidates) {
    const normalized = normalizeStatus(order.order_status);
    const nextStatus = nextTrackStatus(normalized);

    if (!nextStatus) {
      if (normalized === 'Delivered') {
        await Order.updateOne(
          { _id: order._id },
          { $set: { auto_tracking_enabled: false, next_auto_status_at: null } }
        );
      }
      continue;
    }

    const statusUpdatedAt = order.status_updated_at || order.createdAt || now;

    // Initialize schedule for legacy records that don't have the next timestamp yet.
    if (!order.next_auto_status_at) {
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            order_status: normalized,
            status_updated_at: statusUpdatedAt,
            next_auto_status_at: new Date(statusUpdatedAt.getTime() + randomTrackingIntervalMs()),
          },
        }
      );
      continue;
    }

    if (order.next_auto_status_at > now) continue;

    const updates = {
      order_status: nextStatus,
      status_updated_at: now,
    };

    if (nextStatus === 'Delivered') {
      updates.auto_tracking_enabled = false;
      updates.next_auto_status_at = null;
    } else {
      updates.next_auto_status_at = new Date(now.getTime() + randomTrackingIntervalMs());
    }

    await Order.updateOne({ _id: order._id }, { $set: updates });
  }
}

function startOrderAutoTracker() {
  runAutoTrackingTick().catch((err) => {
    console.error('Auto-tracker initial run failed:', err.message);
  });

  const tickEveryMs = 10 * 60 * 1000;
  return setInterval(() => {
    runAutoTrackingTick().catch((err) => {
      console.error('Auto-tracker tick failed:', err.message);
    });
  }, tickEveryMs);
}

module.exports = {
  startOrderAutoTracker,
  randomTrackingIntervalMs,
};
