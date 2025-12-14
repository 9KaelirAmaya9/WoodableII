const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    createWorkOrder,
    getWorkOrders,
    getWorkOrderById,
    updateWorkOrder,
    deleteWorkOrder,
    downloadWorkOrderPDF
} = require('../controllers/workOrderController');

// All routes require authentication
router.use(authenticate);

// Work order routes
router.post('/', createWorkOrder);
router.get('/', getWorkOrders);
router.get('/:id', getWorkOrderById);
router.put('/:id', updateWorkOrder);
router.delete('/:id', deleteWorkOrder);
router.get('/:id/pdf', downloadWorkOrderPDF);

module.exports = router;
