import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const OrderDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await orderAPI.getAllOrders();
            setOrders(res.data);
        } catch (err) {
            console.error('Failed to load orders', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await orderAPI.updateStatus(id, status);
            fetchOrders();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#ffc107'; // yellow
            case 'confirmed': return '#17a2b8'; // teal
            case 'ready': return '#28a745'; // green
            case 'completed': return '#6c757d'; // gray
            case 'cancelled': return '#dc3545'; // red
            default: return '#333';
        }
    };

    if (loading) return <div style={styles.container}>Loading orders...</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Kitchen Dashboard 👨‍🍳</h1>
                <div style={styles.nav}>
                    <button style={styles.navBtn} onClick={() => navigate('/admin/menu')}>Manage Menu</button>
                    <button style={styles.navBtnOut} onClick={() => navigate('/')}>Exit</button>
                </div>
            </header>

            <div style={styles.grid}>
                {orders.map(order => (
                    <div key={order.id} style={{ ...styles.card, borderLeft: `5px solid ${getStatusColor(order.status)}` }}>
                        <div style={styles.cardHeader}>
                            <span style={styles.id}>#{order.id}</span>
                            <span style={{ ...styles.status, background: getStatusColor(order.status) }}>{order.status.toUpperCase()}</span>
                        </div>

                        <div style={styles.customer}>
                            <strong>{order.customer_name}</strong>
                            <br />
                            {order.customer_phone}
                        </div>

                        <div style={styles.items}>
                            {order.items.map((item, idx) => (
                                <div key={idx} style={styles.item}>
                                    {item.quantity}x {item.name}
                                </div>
                            ))}
                        </div>

                        {order.special_instructions && (
                            <div style={styles.note}>
                                Note: {order.special_instructions}
                            </div>
                        )}

                        <div style={styles.total}>
                            Total: ${order.total_price}
                        </div>

                        <div style={styles.actions}>
                            {order.status === 'pending' && (
                                <button style={styles.confirmBtn} onClick={() => handleStatusUpdate(order.id, 'confirmed')}>Accept</button>
                            )}
                            {order.status === 'confirmed' && (
                                <button style={styles.readyBtn} onClick={() => handleStatusUpdate(order.id, 'ready')}>Order Ready</button>
                            )}
                            {order.status === 'ready' && (
                                <button style={styles.completeBtn} onClick={() => handleStatusUpdate(order.id, 'completed')}>Complete</button>
                            )}
                            {['pending', 'confirmed'].includes(order.status) && (
                                <button style={styles.cancelBtn} onClick={() => handleStatusUpdate(order.id, 'cancelled')}>Cancel</button>
                            )}
                        </div>
                        <p style={styles.time}>{new Date(order.created_at).toLocaleTimeString()}</p>
                    </div>
                ))}

                {orders.length === 0 && (
                    <p>No orders yet. Waiting for hungry customers...</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    nav: { display: 'flex', gap: '10px' },
    navBtn: { padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    navBtnOut: { padding: '10px 20px', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    id: { fontSize: '1.2rem', fontWeight: 'bold', color: '#666' },
    status: { padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' },
    customer: { fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' },
    items: { flex: 1 },
    item: { fontSize: '1.1rem' },
    note: { background: '#fff3cd', padding: '10px', borderRadius: '4px', fontStyle: 'italic', fontSize: '0.9rem' },
    total: { fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'right' },
    actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    confirmBtn: { padding: '10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    readyBtn: { padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    completeBtn: { padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    cancelBtn: { padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    time: { fontSize: '0.8rem', color: '#999', textAlign: 'right', margin: 0 }
};

export default OrderDashboard;
