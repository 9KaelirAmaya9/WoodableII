const { validationResult } = require('express-validator');
const { query } = require('../config/database');

// @desc    Get all categories (public)
// @route   GET /api/menu/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM categories ORDER BY display_order ASC'
        );
        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all menu items (public)
// @route   GET /api/menu/items
// @access  Public
const getItems = async (req, res) => {
    try {
        const result = await query(
            `SELECT m.*, c.name as category_name 
       FROM menu_items m 
       LEFT JOIN categories c ON m.category_id = c.id 
       WHERE m.is_available = true 
       ORDER BY c.display_order ASC, m.id ASC`
        );
        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new category
// @route   POST /api/menu/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, display_order } = req.body;

    try {
        const result = await query(
            `INSERT INTO categories (name, display_order) 
       VALUES ($1, $2) 
       RETURNING *`,
            [name, display_order || 0]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        if (error.code === '23505') { // Unique violation for slug
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new menu item
// @route   POST /api/menu/items
// @access  Private (Admin)
const createItem = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { category_id, name, description, price, image_url, spiciness_level } = req.body;

    try {
        const result = await query(
            `INSERT INTO menu_items (category_id, name, description, price, image_url, spiciness_level) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [category_id, name, description, price, image_url, spiciness_level || 0]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update menu item
// @route   PUT /api/menu/items/:id
// @access  Private (Admin)
const updateItem = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, is_available, spiciness_level } = req.body;

    try {
        const result = await query(
            `UPDATE menu_items 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           price = COALESCE($3, price), 
           is_available = COALESCE($4, is_available),
           spiciness_level = COALESCE($5, spiciness_level)
       WHERE id = $6 
       RETURNING *`,
            [name, description, price, is_available, spiciness_level, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/items/:id
// @access  Private (Admin)
const deleteItem = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        res.json({
            success: true,
            message: 'Item deleted',
        });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getCategories,
    getItems,
    createCategory,
    createItem,
    updateItem,
    deleteItem,
};
