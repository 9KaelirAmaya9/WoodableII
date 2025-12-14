import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrderAPI } from '../../services/api';
import Navigation from '../../components/Navigation';

const WorkOrderForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        // Client Information
        clientName: '',
        clientAddress: '',
        clientCity: '',
        clientState: '',
        clientZip: '',
        clientPhone: '',
        clientDlLicense: '',

        // Vehicle Information
        vehicleVin: '',
        vehicleOdometer: '',
        vehicleYear: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleLicensePlate: '',

        // Pricing
        taxRate: '8.875',
        clientSalePrice: '',

        // Other
        otherComments: '',
    });

    const [items, setItems] = useState([
        { description: '', taxed: true, unitPrice: '', quantity: 1 }
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', taxed: true, unitPrice: '', quantity: 1 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => {
            const price = parseFloat(item.unitPrice) || 0;
            const qty = parseInt(item.quantity) || 0;
            return sum + (price * qty);
        }, 0);
    };

    const calculateTax = () => {
        const subtotal = calculateSubtotal();
        const rate = parseFloat(formData.taxRate) / 100 || 0;
        return subtotal * rate;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    const calculateProfit = () => {
        const salePrice = parseFloat(formData.clientSalePrice) || 0;
        const total = calculateTotal();
        return salePrice - total;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!formData.clientName.trim()) {
            setError('Client name is required');
            return;
        }

        const validItems = items.filter(item =>
            item.description.trim() && item.unitPrice && item.quantity
        );

        if (validItems.length === 0) {
            setError('At least one item with description, price, and quantity is required');
            return;
        }

        setLoading(true);

        try {
            const workOrderData = {
                ...formData,
                taxRate: parseFloat(formData.taxRate) / 100,
                clientSalePrice: formData.clientSalePrice ? parseFloat(formData.clientSalePrice) : null,
                vehicleOdometer: formData.vehicleOdometer ? parseInt(formData.vehicleOdometer) : null,
                vehicleYear: formData.vehicleYear ? parseInt(formData.vehicleYear) : null,
                items: validItems.map(item => ({
                    description: item.description,
                    taxed: item.taxed,
                    unitPrice: parseFloat(item.unitPrice),
                    quantity: parseInt(item.quantity)
                }))
            };

            const response = await workOrderAPI.createWorkOrder(workOrderData);
            setSuccess(`Work order ${response.workOrder.work_order_number} created successfully!`);

            // Redirect to work order dashboard after 2 seconds
            setTimeout(() => {
                navigate('/admin/workorders');
            }, 2000);

        } catch (err) {
            console.error('Error creating work order:', err);
            setError(err.response?.data?.error || 'Failed to create work order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <Navigation />
            <div style={styles.content}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Create Work Order</h1>
                    <button
                        style={styles.backButton}
                        onClick={() => navigate('/admin/workorders')}
                    >
                        ← Back to Work Orders
                    </button>
                </div>

                {error && <div style={styles.errorBox}>{error}</div>}
                {success && <div style={styles.successBox}>{success}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Client Information */}
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Client Information</h2>
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Client Name *</label>
                                <input
                                    type="text"
                                    name="clientName"
                                    value={formData.clientName}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Phone</label>
                                <input
                                    type="tel"
                                    name="clientPhone"
                                    value={formData.clientPhone}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    placeholder="(000) 000-0000"
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Address</label>
                                <input
                                    type="text"
                                    name="clientAddress"
                                    value={formData.clientAddress}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>City</label>
                                <input
                                    type="text"
                                    name="clientCity"
                                    value={formData.clientCity}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>State</label>
                                <input
                                    type="text"
                                    name="clientState"
                                    value={formData.clientState}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    maxLength="2"
                                    placeholder="TX"
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>ZIP</label>
                                <input
                                    type="text"
                                    name="clientZip"
                                    value={formData.clientZip}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    maxLength="10"
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>DL/License # and State</label>
                                <input
                                    type="text"
                                    name="clientDlLicense"
                                    value={formData.clientDlLicense}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Vehicle Information</h2>
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>VIN</label>
                                <input
                                    type="text"
                                    name="vehicleVin"
                                    value={formData.vehicleVin}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    maxLength="17"
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Odometer</label>
                                <input
                                    type="number"
                                    name="vehicleOdometer"
                                    value={formData.vehicleOdometer}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Year</label>
                                <input
                                    type="number"
                                    name="vehicleYear"
                                    value={formData.vehicleYear}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                    min="1900"
                                    max={new Date().getFullYear() + 1}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Make</label>
                                <input
                                    type="text"
                                    name="vehicleMake"
                                    value={formData.vehicleMake}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Model</label>
                                <input
                                    type="text"
                                    name="vehicleModel"
                                    value={formData.vehicleModel}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>License Plate</label>
                                <input
                                    type="text"
                                    name="vehicleLicensePlate"
                                    value={formData.vehicleLicensePlate}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job Details */}
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Job Details</h2>
                        <div style={styles.itemsTable}>
                            <div style={styles.tableHeader}>
                                <div style={styles.colDescription}>Description *</div>
                                <div style={styles.colTaxed}>Taxed</div>
                                <div style={styles.colPrice}>Unit Price *</div>
                                <div style={styles.colQty}>Qty *</div>
                                <div style={styles.colTotal}>Total</div>
                                <div style={styles.colActions}>Actions</div>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} style={styles.tableRow}>
                                    <div style={styles.colDescription}>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            style={styles.input}
                                            placeholder="Enter description"
                                        />
                                    </div>
                                    <div style={styles.colTaxed}>
                                        <input
                                            type="checkbox"
                                            checked={item.taxed}
                                            onChange={(e) => handleItemChange(index, 'taxed', e.target.checked)}
                                            style={styles.checkbox}
                                        />
                                    </div>
                                    <div style={styles.colPrice}>
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                            style={styles.input}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div style={styles.colQty}>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            style={styles.input}
                                            min="1"
                                        />
                                    </div>
                                    <div style={styles.colTotal}>
                                        ${((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
                                    </div>
                                    <div style={styles.colActions}>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            style={styles.removeButton}
                                            disabled={items.length === 1}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            style={styles.addButton}
                        >
                            + Add Item
                        </button>
                    </div>

                    {/* Pricing Summary */}
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Pricing Summary</h2>
                        <div style={styles.pricingGrid}>
                            <div style={styles.pricingRow}>
                                <span style={styles.pricingLabel}>Subtotal:</span>
                                <span style={styles.pricingValue}>${calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div style={styles.pricingRow}>
                                <span style={styles.pricingLabel}>Tax Rate (%):</span>
                                <input
                                    type="number"
                                    name="taxRate"
                                    value={formData.taxRate}
                                    onChange={handleInputChange}
                                    style={{ ...styles.input, width: '100px' }}
                                    step="0.001"
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div style={styles.pricingRow}>
                                <span style={styles.pricingLabel}>Tax:</span>
                                <span style={styles.pricingValue}>${calculateTax().toFixed(2)}</span>
                            </div>
                            <div style={styles.pricingRow}>
                                <span style={styles.pricingLabel}>Total:</span>
                                <span style={{ ...styles.pricingValue, ...styles.totalValue }}>${calculateTotal().toFixed(2)}</span>
                            </div>
                            <div style={styles.pricingRow}>
                                <span style={styles.pricingLabel}>Client/Sale Price:</span>
                                <input
                                    type="number"
                                    name="clientSalePrice"
                                    value={formData.clientSalePrice}
                                    onChange={handleInputChange}
                                    style={{ ...styles.input, width: '150px' }}
                                    step="0.01"
                                    min="0"
                                    placeholder="Optional"
                                />
                            </div>
                            {formData.clientSalePrice && (
                                <div style={styles.pricingRow}>
                                    <span style={styles.pricingLabel}>Profit:</span>
                                    <span style={{
                                        ...styles.pricingValue,
                                        color: calculateProfit() >= 0 ? '#28a745' : '#dc3545'
                                    }}>
                                        ${calculateProfit().toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Other Comments */}
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Other Comments</h2>
                        <textarea
                            name="otherComments"
                            value={formData.otherComments}
                            onChange={handleInputChange}
                            style={styles.textarea}
                            rows="4"
                            placeholder="Enter any additional comments or notes..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div style={styles.submitSection}>
                        <button
                            type="submit"
                            style={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Work Order'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/workorders')}
                            style={styles.cancelButton}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: '#f5f7fa'
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#333'
    },
    backButton: {
        padding: '10px 20px',
        background: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    errorBox: {
        background: '#f8d7da',
        color: '#721c24',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #f5c6cb'
    },
    successBox: {
        background: '#d4edda',
        color: '#155724',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #c3e6cb'
    },
    form: {
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    section: {
        marginBottom: '30px'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '2px solid #667eea'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#555',
        marginBottom: '5px'
    },
    input: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        transition: 'border-color 0.2s'
    },
    textarea: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        fontFamily: 'inherit',
        resize: 'vertical'
    },
    itemsTable: {
        marginBottom: '15px'
    },
    tableHeader: {
        display: 'grid',
        gridTemplateColumns: '3fr 0.5fr 1fr 0.5fr 1fr 0.5fr',
        gap: '10px',
        padding: '10px',
        background: '#667eea',
        color: 'white',
        fontWeight: '600',
        borderRadius: '6px 6px 0 0',
        fontSize: '14px'
    },
    tableRow: {
        display: 'grid',
        gridTemplateColumns: '3fr 0.5fr 1fr 0.5fr 1fr 0.5fr',
        gap: '10px',
        padding: '10px',
        borderBottom: '1px solid #eee',
        alignItems: 'center'
    },
    colDescription: { gridColumn: '1' },
    colTaxed: { gridColumn: '2', textAlign: 'center' },
    colPrice: { gridColumn: '3' },
    colQty: { gridColumn: '4' },
    colTotal: { gridColumn: '5', fontWeight: '600' },
    colActions: { gridColumn: '6', textAlign: 'center' },
    checkbox: {
        width: '20px',
        height: '20px',
        cursor: 'pointer'
    },
    removeButton: {
        background: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '5px 10px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    addButton: {
        padding: '10px 20px',
        background: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    pricingGrid: {
        maxWidth: '400px',
        marginLeft: 'auto'
    },
    pricingRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #eee'
    },
    pricingLabel: {
        fontWeight: '600',
        color: '#555'
    },
    pricingValue: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#333'
    },
    totalValue: {
        fontSize: '20px',
        color: '#667eea'
    },
    submitSection: {
        display: 'flex',
        gap: '15px',
        justifyContent: 'flex-end',
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: '2px solid #eee'
    },
    submitButton: {
        padding: '12px 30px',
        background: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    cancelButton: {
        padding: '12px 30px',
        background: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    }
};

export default WorkOrderForm;
