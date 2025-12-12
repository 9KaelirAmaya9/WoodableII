const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
    getCategories,
    getItems,
    createCategory,
    createItem,
    updateItem,
    deleteItem,
} = require('../controllers/menuController');
const { protect, restrictTo } = require('../middleware/auth');

// Public Routes
router.get('/categories', getCategories);
router.get('/items', getItems);

// Admin Routes
router.post(
    '/categories',
    protect,
    restrictTo('admin'),
    [
        check('name', 'Name is required').not().isEmpty(),
    ],
    createCategory
);

router.post(
    '/items',
    protect,
    restrictTo('admin'),
    [
        check('category_id', 'Category ID is required').isNumeric(),
        check('name', 'Name is required').not().isEmpty(),
        check('price', 'Price is required').isNumeric(),
    ],
    createItem
);

router.put('/items/:id', protect, restrictTo('admin'), updateItem);
router.delete('/items/:id', protect, restrictTo('admin'), deleteItem);

module.exports = router;
