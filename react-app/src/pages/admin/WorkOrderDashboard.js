import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrderAPI } from '../../services/api';
import Navigation from '../../components/Navigation';

const WorkOrderDashboard = () => {
    const navigate = useNavigate();
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        startDate: '',
        endDate: ''
    });
    const [stats, setStats] = useState({
        total: 0,
        thisMonth: 0,
        revenue: 0
    });

    useEffect(() => {
        fetchWorkOrders();
    }, [filters]);

    const fetchWorkOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await workOrderAPI.getWorkOrders(filters);
            setWorkOrders(response.workOrders);

            // Calculate stats
            const now = new Date();
            const thisMonth = response.workOrders.filter(wo => {
                const woDate = new Date(wo.date);
                return woDate.getMonth() === now.getMonth() &&
                    woDate.getFullYear() === now.getFullYear();
            });

            const totalRevenue = response.workOrders.reduce((sum, wo) =>
                sum + parseFloat(wo.total || 0), 0
            );

            setStats({
                total: response.total || response.workOrders.length,
                thisMonth: thisMonth.length,
                revenue: totalRevenue
            });

        } catch (err) {
            console.error('Error fetching work orders:', err);
            setError('Failed to load work orders');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDownloadPDF = async (id, workOrderNumber) => {
        try {
            const blob = await workOrderAPI.downloadPDF(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `WorkOrder_${workOrderNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading PDF:', err);
            alert('Failed to download PDF');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this work order?')) {
            return;
        }

        try {
            await workOrderAPI.deleteWorkOrder(id);
            fetchWorkOrders();
        } catch (err) {
            console.error('Error deleting work order:', err);
            alert('Failed to delete work order');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#ffc107',
            in_progress: '#17a2b8',
            completed: '#28a745',
            cancelled: '#dc3545'
        };
        return colors[status] || '#6c757d';
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pending',
            in_progress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled'
        };
        return labels[status] || status;
    };

    return (
        <div style={styles.container}>
            <Navigation />
            <div style={styles.content}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Work Orders</h1>
                    <button
                        style={styles.createButton}
                        onClick={() => navigate('/admin/workorders/new')}
                    >
                        + Create Work Order
                    </button>
                </div>

                {/* Statistics Cards */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>📋</div>
                        <div style={styles.statValue}>{stats.total}</div>
                        <div style={styles.statLabel}>Total Work Orders</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>📅</div>
                        <div style={styles.statValue}>{stats.thisMonth}</div>
                        <div style={styles.statLabel}>This Month</div>
                    </div>
                    <div style={styles.statCard}>
                        <div style={styles.statIcon}>💰</div>
                        <div style={styles.statValue}>{formatCurrency(stats.revenue)}</div>
                        <div style={styles.statLabel}>Total Revenue</div>
                    </div>
                </div>

                {/* Filters */}
                <div style={styles.filtersSection}>
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Search</label>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="Client name or WO#"
                            style={styles.filterInput}
                        />
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            style={styles.filterInput}
                        />
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            style={styles.filterInput}
                        />
                    </div>

                    <button
                        onClick={() => setFilters({ status: '', search: '', startDate: '', endDate: '' })}
                        style={styles.clearButton}
                    >
                        Clear Filters
                    </button>
                </div>

                {error && <div style={styles.errorBox}>{error}</div>}

                {/* Work Orders Table */}
                <div style={styles.tableContainer}>
                    {loading ? (
                        <div style={styles.loadingBox}>Loading work orders...</div>
                    ) : workOrders.length === 0 ? (
                        <div style={styles.emptyBox}>
                            <p>No work orders found</p>
                            <button
                                style={styles.createButton}
                                onClick={() => navigate('/admin/workorders/new')}
                            >
                                Create Your First Work Order
                            </button>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeader}>
                                    <th style={styles.th}>WO #</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Client Name</th>
                                    <th style={styles.th}>Vehicle</th>
                                    <th style={styles.th}>Total</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workOrders.map((wo) => (
                                    <tr key={wo.id} style={styles.tableRow}>
                                        <td style={styles.td}>
                                            <strong>{wo.work_order_number}</strong>
                                        </td>
                                        <td style={styles.td}>{formatDate(wo.date)}</td>
                                        <td style={styles.td}>{wo.client_name}</td>
                                        <td style={styles.td}>
                                            {wo.vehicle_year && wo.vehicle_make && wo.vehicle_model
                                                ? `${wo.vehicle_year} ${wo.vehicle_make} ${wo.vehicle_model}`
                                                : '-'}
                                        </td>
                                        <td style={styles.td}>
                                            <strong>{formatCurrency(wo.total)}</strong>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                background: getStatusColor(wo.status)
                                            }}>
                                                {getStatusLabel(wo.status)}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.actionButtons}>
                                                <button
                                                    onClick={() => handleDownloadPDF(wo.id, wo.work_order_number)}
                                                    style={styles.actionButton}
                                                    title="Download PDF"
                                                >
                                                    📄
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/workorders/${wo.id}`)}
                                                    style={styles.actionButton}
                                                    title="View/Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(wo.id)}
                                                    style={{ ...styles.actionButton, ...styles.deleteButton }}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
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
        maxWidth: '1400px',
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
    createButton: {
        padding: '12px 24px',
        background: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    statCard: {
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
    },
    statIcon: {
        fontSize: '36px',
        marginBottom: '10px'
    },
    statValue: {
        fontSize: '32px',
        fontWeight: '700',
        color: '#667eea',
        marginBottom: '5px'
    },
    statLabel: {
        fontSize: '14px',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    filtersSection: {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        alignItems: 'flex-end'
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: '150px'
    },
    filterLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#555',
        marginBottom: '5px',
        textTransform: 'uppercase'
    },
    filterSelect: {
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px'
    },
    filterInput: {
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px'
    },
    clearButton: {
        padding: '8px 16px',
        background: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
        height: '36px'
    },
    errorBox: {
        background: '#f8d7da',
        color: '#721c24',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #f5c6cb'
    },
    loadingBox: {
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        fontSize: '16px',
        color: '#666'
    },
    emptyBox: {
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center'
    },
    tableContainer: {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    tableHeader: {
        background: '#667eea',
        color: 'white'
    },
    th: {
        padding: '15px',
        textAlign: 'left',
        fontWeight: '600',
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    tableRow: {
        borderBottom: '1px solid #eee',
        transition: 'background 0.2s'
    },
    td: {
        padding: '15px',
        fontSize: '14px',
        color: '#333'
    },
    statusBadge: {
        padding: '4px 12px',
        borderRadius: '12px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-block'
    },
    actionButtons: {
        display: 'flex',
        gap: '8px'
    },
    actionButton: {
        background: 'transparent',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'background 0.2s'
    },
    deleteButton: {
        color: '#dc3545'
    }
};

export default WorkOrderDashboard;
