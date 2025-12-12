import React, { useState, useEffect } from 'react';
import { menuAPI } from '../../services/api';

const MenuManager = () => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('items'); // 'items' or 'categories'

    // Form States
    const [newItem, setNewItem] = useState({ name: '', price: '', description: '', category_id: '' });
    const [newCategory, setNewCategory] = useState({ name: '', description: '', display_order: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, itemRes] = await Promise.all([
                menuAPI.getCategories(),
                menuAPI.getItems()
            ]);
            setCategories(catRes.data);
            setItems(itemRes.data);
            if (catRes.data.length > 0) {
                setNewItem(prev => ({ ...prev, category_id: catRes.data[0].id }));
            }
        } catch (err) {
            setError('Failed to load menu data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await menuAPI.createCategory(newCategory);
            setNewCategory({ name: '', description: '', display_order: 0 });
            fetchData();
        } catch (err) {
            alert('Failed to create category');
        }
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        try {
            await menuAPI.createItem(newItem);
            setNewItem({ name: '', price: '', description: '', category_id: categories[0]?.id || '' });
            fetchData();
        } catch (err) {
            alert('Failed to create item');
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await menuAPI.deleteItem(id);
            fetchData();
        } catch (err) {
            alert('Failed to delete item');
        }
    };

    if (loading) return <div style={styles.container}>Loading...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1>Menu Manager (Admin)</h1>
                <div style={styles.tabs}>
                    <button
                        style={activeTab === 'items' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('items')}
                    >
                        Menu Items
                    </button>
                    <button
                        style={activeTab === 'categories' ? styles.activeTab : styles.tab}
                        onClick={() => setActiveTab('categories')}
                    >
                        Categories
                    </button>
                </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.content}>
                {activeTab === 'categories' && (
                    <div style={styles.section}>
                        <h2>Create Category</h2>
                        <form onSubmit={handleCreateCategory} style={styles.form}>
                            <input
                                style={styles.input}
                                placeholder="Category Name"
                                value={newCategory.name}
                                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                                required
                            />
                            <input
                                style={styles.input}
                                placeholder="Description"
                                value={newCategory.description}
                                onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                            />
                            <input
                                style={styles.input}
                                type="number"
                                placeholder="Order"
                                value={newCategory.display_order}
                                onChange={e => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) })}
                            />
                            <button type="submit" style={styles.button}>Add Category</button>
                        </form>

                        <div style={styles.list}>
                            {categories.map(cat => (
                                <div key={cat.id} style={styles.listItem}>
                                    <span><strong>{cat.name}</strong> (Order: {cat.display_order})</span>
                                    <span>{cat.slug}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'items' && (
                    <div style={styles.section}>
                        <h2>Create Menu Item</h2>
                        <form onSubmit={handleCreateItem} style={styles.form}>
                            <select
                                style={styles.input}
                                value={newItem.category_id}
                                onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input
                                style={styles.input}
                                placeholder="Item Name"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                required
                            />
                            <input
                                style={styles.input}
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                value={newItem.price}
                                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                required
                            />
                            <input
                                style={styles.input}
                                placeholder="Description"
                                value={newItem.description}
                                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            />
                            <button type="submit" style={styles.button}>Add Item</button>
                        </form>

                        <div style={styles.grid}>
                            {items.map(item => (
                                <div key={item.id} style={styles.card}>
                                    <h3>{item.name}</h3>
                                    <p>{item.description}</p>
                                    <p>${item.price}</p>
                                    <span style={styles.badge}>{item.category_name}</span>
                                    <button onClick={() => handleDeleteItem(item.id)} style={styles.deleteButton}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
    header: { marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' },
    tabs: { display: 'flex', gap: '10px', marginTop: '20px' },
    tab: { padding: '10px 20px', cursor: 'pointer', background: '#f5f5f5', border: 'none', borderRadius: '5px' },
    activeTab: { padding: '10px 20px', cursor: 'pointer', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px' },
    form: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '10px' },
    input: { padding: '10px', borderRadius: '5px', border: '1px solid #ddd' },
    button: { padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    listItem: { padding: '15px', background: 'white', border: '1px solid #eee', borderRadius: '5px', display: 'flex', justifyContent: 'space-between' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
    card: { padding: '20px', border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
    badge: { display: 'inline-block', padding: '3px 8px', background: '#eee', borderRadius: '10px', fontSize: '12px', marginTop: '10px', marginRight: '10px' },
    deleteButton: { padding: '5px 10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' },
    error: { color: 'red', marginBottom: '20px' }
};

export default MenuManager;
