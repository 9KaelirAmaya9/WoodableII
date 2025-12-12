const { validationResult } = require('express-validator');
const { query, pool } = require('../config/database');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (or Private)
const createOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { items, customer_name, customer_phone, special_instructions } = req.body;
    // items: [{ id, quantity }]

    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'No items in order' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Calculate Total and Verify Items
        let totalPrice = 0;
        const orderItemsData = [];

        for (const item of items) {
            const { rows } = await client.query('SELECT * FROM menu_items WHERE id = $1', [item.id]);
            if (rows.length === 0) {
                throw new Error(`Item ${item.id} not found`);
            }
            const menuItem = rows[0];
            if (!menuItem.is_available) {
                throw new Error(`Item ${menuItem.name} is not available`);
            }

            const price = parseFloat(menuItem.price);
            const quantity = parseInt(item.quantity) || 1;

            totalPrice += price * quantity;
            orderItemsData.push({
                menu_item_id: menuItem.id,
                quantity,
                price_at_time: price,
                item_name: menuItem.name
            });
        }

        // 2. Create Order
        // If user is logged in, attach user_id. (req.user might be present if auth middleware used optionally)
        // For now assume public or strict. Let's make it optional.
        const userId = req.user ? req.user.id : null;

        const orderResult = await client.query(
            `INSERT INTO orders (user_id, total_price, customer_name, customer_phone, special_instructions, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, created_at`,
            [userId, totalPrice, customer_name, customer_phone, special_instructions]
        );

        const orderId = orderResult.rows[0].id;

        // 3. Create Order Items
        for (const item of orderItemsData) {
            await client.query(
                `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time, item_name)
         VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.menu_item_id, item.quantity, item.price_at_time, item.item_name]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: {
                id: orderId,
                total_price: totalPrice,
                status: 'pending'
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create order error:', error);
        res.status(400).json({ success: false, message: error.message || 'Error creating order' });
    } finally {
        client.release();
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
    try {
        // Fetch orders with user details
        const result = await query(
            `SELECT o.*, 
              json_agg(json_build_object('name', oi.item_name, 'quantity', oi.quantity, 'price', oi.price_at_time)) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // pending, confirmed, ready, completed, cancelled

    const validStatuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const result = await query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get analytics data (Admin)
// @route   GET /api/orders/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            // 1. Daily Sales (Last 30 days)
            const dailySales = await client.query(`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, SUM(total_price) as revenue, COUNT(*) as orders
        FROM orders
        WHERE status != 'cancelled' AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY 1
        ORDER BY 1 ASC
      `);

            // 2. Popular Items
            const popularItems = await client.query(`
        SELECT item_name, SUM(quantity) as count
        FROM order_items
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 5
      `);

            // 3. Overall Stats
            const stats = await client.query(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END) as total_revenue,
          AVG(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END) as avg_order_value
        FROM orders
      `);

            res.json({
                success: true,
                data: {
                    daily_sales: dailySales.rows,
                    popular_items: popularItems.rows,
                    stats: stats.rows[0]
                }
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    getAnalytics,
};

