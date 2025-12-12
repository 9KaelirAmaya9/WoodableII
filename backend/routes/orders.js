const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    getAnalytics,
} = require('../controllers/orderController');
const { protect, optionalProtect, restrictTo } = require('../middleware/auth');

// Public (with optional auth)
router.post(
    '/',
    optionalProtect,
    [
        check('items', 'Items are required').isArray({ min: 1 }),
        check('customer_name', 'Customer name is required').not().isEmpty(),
        check('customer_phone', 'Customer phone is required').not().isEmpty(),
    ],
    createOrder
);

// Admin Routes
router.get('/analytics', protect, restrictTo('admin'), getAnalytics);
router.get('/', protect, restrictTo('admin'), getAllOrders);

router.put(
    '/:id/status',
    protect,
    restrictTo('admin'),
    [
        check('status', 'Status is required').isIn(['pending', 'confirmed', 'ready', 'completed', 'cancelled']),
    ],
    updateOrderStatus
);

module.exports = router;
