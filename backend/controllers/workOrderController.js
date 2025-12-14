const pool = require('../config/database');
const { generateWorkOrderPDF } = require('../utils/pdfGenerator');

/**
 * Create a new work order
 */
const createWorkOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      clientName,
      clientAddress,
      clientCity,
      clientState,
      clientZip,
      clientPhone,
      clientDlLicense,
      vehicleVin,
      vehicleOdometer,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicleLicensePlate,
      items, // Array of { description, taxed, unitPrice, quantity }
      taxRate,
      clientSalePrice,
      otherComments
    } = req.body;

    // Validation
    if (!clientName || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'Client name and at least one item are required' 
      });
    }

    await client.query('BEGIN');

    // Generate work order number
    const numberResult = await client.query('SELECT generate_work_order_number() as number');
    const workOrderNumber = numberResult.rows[0].number;

    // Calculate pricing
    let subtotal = 0;
    const processedItems = items.map(item => {
      const itemTotal = parseFloat(item.unitPrice) * parseInt(item.quantity);
      subtotal += itemTotal;
      return {
        ...item,
        total: itemTotal.toFixed(2)
      };
    });

    const taxRateDecimal = parseFloat(taxRate) || 0.0875;
    const taxAmount = (subtotal * taxRateDecimal).toFixed(2);
    const total = (subtotal + parseFloat(taxAmount)).toFixed(2);
    
    const salePrice = clientSalePrice ? parseFloat(clientSalePrice) : null;
    const profit = salePrice ? (salePrice - parseFloat(total)).toFixed(2) : null;

    // Insert work order
    const workOrderQuery = `
      INSERT INTO work_orders (
        work_order_number, client_name, client_address, client_city, 
        client_state, client_zip, client_phone, client_dl_license,
        vehicle_vin, vehicle_odometer, vehicle_year, vehicle_make, 
        vehicle_model, vehicle_license_plate,
        subtotal, tax_rate, tax_amount, total, client_sale_price, profit,
        other_comments, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const workOrderValues = [
      workOrderNumber, clientName, clientAddress, clientCity,
      clientState, clientZip, clientPhone, clientDlLicense,
      vehicleVin, vehicleOdometer, vehicleYear, vehicleMake,
      vehicleModel, vehicleLicensePlate,
      subtotal, taxRateDecimal, taxAmount, total, salePrice, profit,
      otherComments, req.user.id
    ];

    const workOrderResult = await client.query(workOrderQuery, workOrderValues);
    const workOrder = workOrderResult.rows[0];

    // Insert work order items
    const itemsQuery = `
      INSERT INTO work_order_items (
        work_order_id, description, taxed, unit_price, quantity, total
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const insertedItems = [];
    for (const item of processedItems) {
      const itemResult = await client.query(itemsQuery, [
        workOrder.id,
        item.description,
        item.taxed !== false, // Default to true
        item.unitPrice,
        item.quantity,
        item.total
      ]);
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Work order created successfully',
      workOrder: {
        ...workOrder,
        items: insertedItems
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating work order:', error);
    res.status(500).json({ error: 'Failed to create work order' });
  } finally {
    client.release();
  }
};

/**
 * Get all work orders with optional filtering
 */
const getWorkOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT wo.*, u.name as created_by_name,
        COUNT(woi.id) as item_count
      FROM work_orders wo
      LEFT JOIN users u ON wo.created_by = u.id
      LEFT JOIN work_order_items woi ON wo.id = woi.work_order_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (status) {
      query += ` AND wo.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (startDate) {
      query += ` AND wo.date >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND wo.date <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    if (search) {
      query += ` AND (wo.client_name ILIKE $${paramCount} OR wo.work_order_number ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY wo.id, u.name ORDER BY wo.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM work_orders WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
      countParamCount++;
    }

    if (startDate) {
      countQuery += ` AND date >= $${countParamCount}`;
      countValues.push(startDate);
      countParamCount++;
    }

    if (endDate) {
      countQuery += ` AND date <= $${countParamCount}`;
      countValues.push(endDate);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (client_name ILIKE $${countParamCount} OR work_order_number ILIKE $${countParamCount})`;
      countValues.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countValues);

    res.json({
      workOrders: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: 'Failed to fetch work orders' });
  }
};

/**
 * Get a single work order by ID
 */
const getWorkOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const workOrderQuery = `
      SELECT wo.*, u.name as created_by_name
      FROM work_orders wo
      LEFT JOIN users u ON wo.created_by = u.id
      WHERE wo.id = $1
    `;

    const workOrderResult = await pool.query(workOrderQuery, [id]);

    if (workOrderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const itemsQuery = `
      SELECT * FROM work_order_items
      WHERE work_order_id = $1
      ORDER BY id
    `;

    const itemsResult = await pool.query(itemsQuery, [id]);

    res.json({
      ...workOrderResult.rows[0],
      items: itemsResult.rows
    });

  } catch (error) {
    console.error('Error fetching work order:', error);
    res.status(500).json({ error: 'Failed to fetch work order' });
  }
};

/**
 * Update a work order
 */
const updateWorkOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const {
      clientName,
      clientAddress,
      clientCity,
      clientState,
      clientZip,
      clientPhone,
      clientDlLicense,
      vehicleVin,
      vehicleOdometer,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicleLicensePlate,
      items,
      taxRate,
      clientSalePrice,
      otherComments,
      status
    } = req.body;

    await client.query('BEGIN');

    // Check if work order exists
    const checkResult = await client.query('SELECT * FROM work_orders WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Work order not found' });
    }

    // Calculate pricing if items provided
    let subtotal = 0;
    let processedItems = [];
    
    if (items && items.length > 0) {
      processedItems = items.map(item => {
        const itemTotal = parseFloat(item.unitPrice) * parseInt(item.quantity);
        subtotal += itemTotal;
        return {
          ...item,
          total: itemTotal.toFixed(2)
        };
      });
    }

    const taxRateDecimal = parseFloat(taxRate) || 0.0875;
    const taxAmount = (subtotal * taxRateDecimal).toFixed(2);
    const total = (subtotal + parseFloat(taxAmount)).toFixed(2);
    
    const salePrice = clientSalePrice ? parseFloat(clientSalePrice) : null;
    const profit = salePrice ? (salePrice - parseFloat(total)).toFixed(2) : null;

    // Update work order
    const updateQuery = `
      UPDATE work_orders SET
        client_name = COALESCE($1, client_name),
        client_address = COALESCE($2, client_address),
        client_city = COALESCE($3, client_city),
        client_state = COALESCE($4, client_state),
        client_zip = COALESCE($5, client_zip),
        client_phone = COALESCE($6, client_phone),
        client_dl_license = COALESCE($7, client_dl_license),
        vehicle_vin = COALESCE($8, vehicle_vin),
        vehicle_odometer = COALESCE($9, vehicle_odometer),
        vehicle_year = COALESCE($10, vehicle_year),
        vehicle_make = COALESCE($11, vehicle_make),
        vehicle_model = COALESCE($12, vehicle_model),
        vehicle_license_plate = COALESCE($13, vehicle_license_plate),
        subtotal = COALESCE($14, subtotal),
        tax_rate = COALESCE($15, tax_rate),
        tax_amount = COALESCE($16, tax_amount),
        total = COALESCE($17, total),
        client_sale_price = COALESCE($18, client_sale_price),
        profit = COALESCE($19, profit),
        other_comments = COALESCE($20, other_comments),
        status = COALESCE($21, status)
      WHERE id = $22
      RETURNING *
    `;

    const updateValues = [
      clientName, clientAddress, clientCity, clientState, clientZip,
      clientPhone, clientDlLicense, vehicleVin, vehicleOdometer,
      vehicleYear, vehicleMake, vehicleModel, vehicleLicensePlate,
      items ? subtotal : null, items ? taxRateDecimal : null,
      items ? taxAmount : null, items ? total : null,
      salePrice, profit, otherComments, status, id
    ];

    const updateResult = await client.query(updateQuery, updateValues);

    // Update items if provided
    if (items && items.length > 0) {
      // Delete existing items
      await client.query('DELETE FROM work_order_items WHERE work_order_id = $1', [id]);

      // Insert new items
      const itemsQuery = `
        INSERT INTO work_order_items (
          work_order_id, description, taxed, unit_price, quantity, total
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      for (const item of processedItems) {
        await client.query(itemsQuery, [
          id,
          item.description,
          item.taxed !== false,
          item.unitPrice,
          item.quantity,
          item.total
        ]);
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Work order updated successfully',
      workOrder: updateResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating work order:', error);
    res.status(500).json({ error: 'Failed to update work order' });
  } finally {
    client.release();
  }
};

/**
 * Delete a work order
 */
const deleteWorkOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM work_orders WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    res.json({ message: 'Work order deleted successfully' });

  } catch (error) {
    console.error('Error deleting work order:', error);
    res.status(500).json({ error: 'Failed to delete work order' });
  }
};

/**
 * Generate and download work order PDF
 */
const downloadWorkOrderPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch work order with items
    const workOrderQuery = `
      SELECT wo.*, u.name as created_by_name
      FROM work_orders wo
      LEFT JOIN users u ON wo.created_by = u.id
      WHERE wo.id = $1
    `;

    const workOrderResult = await pool.query(workOrderQuery, [id]);

    if (workOrderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }

    const itemsQuery = `
      SELECT * FROM work_order_items
      WHERE work_order_id = $1
      ORDER BY id
    `;

    const itemsResult = await pool.query(itemsQuery, [id]);

    const workOrderData = {
      ...workOrderResult.rows[0],
      items: itemsResult.rows
    };

    // Generate PDF
    const pdfBuffer = await generateWorkOrderPDF(workOrderData);

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="WorkOrder_${workOrderData.work_order_number}.pdf"`
    );

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = {
  createWorkOrder,
  getWorkOrders,
  getWorkOrderById,
  updateWorkOrder,
  deleteWorkOrder,
  downloadWorkOrderPDF
};
