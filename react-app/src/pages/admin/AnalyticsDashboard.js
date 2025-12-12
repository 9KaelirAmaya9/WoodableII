import React, { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await orderAPI.getAnalytics();
            setData(res.data);
        } catch (err) {
            console.error('Failed to load analytics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={styles.container}>Loading analytics...</div>;
    if (!data) return <div style={styles.container}>Error loading data</div>;

    const { daily_sales, popular_items, stats } = data;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Analytics & Reports 📈</h1>
                <div style={styles.nav}>
                    <button style={styles.navBtn} onClick={() => navigate('/admin/orders')}>Orders</button>
                    <button style={styles.navBtn} onClick={() => navigate('/admin/menu')}>Menu</button>
                    <button style={styles.navBtnOut} onClick={() => navigate('/')}>Exit</button>
                </div>
            </header>

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <h3>Total Revenue</h3>
                    <p style={styles.statValue}>${parseFloat(stats.total_revenue || 0).toFixed(2)}</p>
                </div>
                <div style={styles.statCard}>
                    <h3>Total Orders</h3>
                    <p style={styles.statValue}>{stats.total_orders}</p>
                </div>
                <div style={styles.statCard}>
                    <h3>Avg Order Value</h3>
                    <p style={styles.statValue}>${parseFloat(stats.avg_order_value || 0).toFixed(2)}</p>
                </div>
            </div>

            <div style={styles.chartsGrid}>
                <div style={styles.chartCard}>
                    <h3>Daily Revenue (Last 30 Days)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={daily_sales}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={styles.chartCard}>
                    <h3>Top 5 Popular Items</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={popular_items}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="item_name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
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
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
    statCard: { padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' },
    statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#667eea', margin: '10px 0 0 0' },
    chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' },
    chartCard: { padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }
};

export default AnalyticsDashboard;
