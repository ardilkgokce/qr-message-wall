import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { BACKEND_URL } from '../config';
import './AdminPanel.css';

function AdminPanel() {
    const navigate = useNavigate();
    const location = useLocation();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState({
        activeConnections: 0,
        totalMessages: 0,
        messagesBySection: {}
    });
    const [logs, setLogs] = useState([]);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('adminDarkMode') === 'true';
    });

    const sectionTitles = {
        section1: '🎉 Kutlamalar',
        section2: '💭 Dilekler',
        section3: '💡 Fikirler',
        section4: '❤️ Teşekkürler',
        section5: '📢 Duyurular'
    };

    // URL key kontrolü
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const key = params.get('key');

        if (key !== 'admin123') {
            navigate('/');
        }
    }, [location, navigate]);

    // Socket.io bağlantısı
    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        // Real-time event'leri dinle
        newSocket.on('message-added', () => {
            fetchMessages();
            fetchStatus();
        });

        newSocket.on('message-deleted', () => {
            fetchMessages();
            fetchStatus();
        });

        newSocket.on('section-cleared', () => {
            fetchMessages();
            fetchStatus();
        });

        newSocket.on('all-messages-cleared', () => {
            fetchMessages();
            fetchStatus();
        });

        return () => newSocket.close();
    }, []);

    // İlk yükleme
    useEffect(() => {
        fetchMessages();
        fetchStatus();
        fetchLogs();

        // Her 5 saniyede bir status ve log güncelle
        const interval = setInterval(() => {
            fetchStatus();
            fetchLogs();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Dark mode değişikliğinde localStorage'a kaydet
    useEffect(() => {
        localStorage.setItem('adminDarkMode', darkMode);
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/messages`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Mesajlar yüklenemedi:', error);
        }
    };

    const fetchStatus = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/status`);
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            console.error('Durum yüklenemedi:', error);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/logs?limit=10`);
            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error('Loglar yüklenemedi:', error);
        }
    };

    const deleteMessage = async (section, id) => {
        if (!window.confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await fetch(`${BACKEND_URL}/api/admin/message/${section}/${id}`, {
                method: 'DELETE'
            });
            fetchMessages();
            fetchStatus();
            fetchLogs();
        } catch (error) {
            console.error('Mesaj silinemedi:', error);
        }
    };

    const deleteSelected = async () => {
        if (selectedMessages.length === 0) {
            alert('Lütfen silmek için mesaj seçin');
            return;
        }

        if (!window.confirm(`${selectedMessages.length} mesajı silmek istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            for (const msgId of selectedMessages) {
                const message = messages.find(m => m.id === msgId);
                if (message) {
                    await fetch(`${BACKEND_URL}/api/admin/message/${message.section}/${message.id}`, {
                        method: 'DELETE'
                    });
                }
            }
            setSelectedMessages([]);
            fetchMessages();
            fetchStatus();
            fetchLogs();
        } catch (error) {
            console.error('Mesajlar silinemedi:', error);
        }
    };

    const deleteAll = async () => {
        const confirmText = 'TÜM MESAJLAR SİLİNSİN';
        const userInput = window.prompt(
            `Tüm mesajları silmek için "${confirmText}" yazın:`
        );

        if (userInput !== confirmText) {
            return;
        }

        try {
            await fetch(`${BACKEND_URL}/api/admin/messages/clear-all`, {
                method: 'POST'
            });
            setSelectedMessages([]);
            fetchMessages();
            fetchStatus();
            fetchLogs();
        } catch (error) {
            console.error('Mesajlar silinemedi:', error);
        }
    };

    const exportCSV = () => {
        if (messages.length === 0) {
            alert('Dışa aktarılacak mesaj yok');
            return;
        }

        const header = 'Bölüm,Gönderen,Mesaj,Tarih/Saat\n';
        const csv = messages
            .sort((a, b) => a.section.localeCompare(b.section))
            .map(msg => {
                const section = sectionTitles[msg.section] || msg.section;
                const author = msg.author.replace(/,/g, ';');
                const text = msg.text.replace(/,/g, ';').replace(/\n/g, ' ');
                const date = new Date(msg.timestamp).toLocaleString('tr-TR');
                return `${section},${author},${text},${date}`;
            })
            .join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + header + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `messages_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const toggleMessageSelection = (id) => {
        setSelectedMessages(prev =>
            prev.includes(id)
                ? prev.filter(msgId => msgId !== id)
                : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedMessages.length === messages.length) {
            setSelectedMessages([]);
        } else {
            setSelectedMessages(messages.map(m => m.id));
        }
    };

    return (
        <div className={`admin-panel ${darkMode ? 'dark' : 'light'}`}>
            <header className="admin-header">
                <div className="header-left">
                    <h1>🎛️ Admin Kontrol Paneli</h1>
                    <button onClick={() => navigate('/')}>← Ana Sayfaya Dön</button>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Aktif Bağlantı</span>
                        <span className="stat-value">{status.activeConnections}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Toplam Mesaj</span>
                        <span className="stat-value">{status.totalMessages}</span>
                    </div>
                    <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? '☀️ Light' : '🌙 Dark'}
                    </button>
                </div>
            </header>

            <div className="admin-content">
                <section className="messages-section">
                    <div className="section-header">
                        <h2>Mesajlar ({messages.length})</h2>
                        <div className="table-controls">
                            <button onClick={exportCSV} className="btn-primary">
                                📥 CSV İndir
                            </button>
                            <button
                                onClick={deleteSelected}
                                className="btn-warning"
                                disabled={selectedMessages.length === 0}
                            >
                                🗑️ Seçilenleri Sil ({selectedMessages.length})
                            </button>
                            <button onClick={deleteAll} className="btn-danger">
                                ⚠️ Tümünü Sil
                            </button>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="table-container">
                        <table className="messages-table">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={selectedMessages.length === messages.length && messages.length > 0}
                                            onChange={toggleAllSelection}
                                        />
                                    </th>
                                    <th>Bölüm</th>
                                    <th>Gönderen</th>
                                    <th>Mesaj</th>
                                    <th>Tarih/Saat</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {messages.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="no-data">Henüz mesaj yok</td>
                                    </tr>
                                ) : (
                                    messages.map(msg => (
                                        <tr key={`${msg.section}-${msg.id}`}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMessages.includes(msg.id)}
                                                    onChange={() => toggleMessageSelection(msg.id)}
                                                />
                                            </td>
                                            <td>
                                                <span className="section-badge">
                                                    {sectionTitles[msg.section]}
                                                </span>
                                            </td>
                                            <td>{msg.author}</td>
                                            <td className="message-text-cell">{msg.text}</td>
                                            <td className="date-cell">
                                                {new Date(msg.timestamp).toLocaleString('tr-TR')}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => deleteMessage(msg.section, msg.id)}
                                                    className="btn-delete"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-messages-list">
                        {messages.length === 0 ? (
                            <div className="mobile-no-messages">
                                Henüz mesaj yok
                            </div>
                        ) : (
                            <>
                                <div className="mobile-select-all">
                                    <input
                                        type="checkbox"
                                        checked={selectedMessages.length === messages.length}
                                        onChange={toggleAllSelection}
                                        id="mobile-select-all"
                                    />
                                    <label htmlFor="mobile-select-all">
                                        Tümünü Seç ({messages.length})
                                    </label>
                                </div>
                                {messages.map(msg => (
                                    <div
                                        key={`mobile-${msg.section}-${msg.id}`}
                                        className={`mobile-message-card ${selectedMessages.includes(msg.id) ? 'selected' : ''}`}
                                    >
                                        <div className="mobile-card-header">
                                            <div className="mobile-card-header-left">
                                                <input
                                                    type="checkbox"
                                                    className="mobile-checkbox"
                                                    checked={selectedMessages.includes(msg.id)}
                                                    onChange={() => toggleMessageSelection(msg.id)}
                                                />
                                                <span className="mobile-section-badge">
                                                    {sectionTitles[msg.section]}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => deleteMessage(msg.section, msg.id)}
                                                className="mobile-delete-btn"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <div className="mobile-card-author">
                                            👤 {msg.author}
                                        </div>
                                        <div className="mobile-card-message">
                                            {msg.text}
                                        </div>
                                        <div className="mobile-card-footer">
                                            <span className="mobile-card-date">
                                                📅 {new Date(msg.timestamp).toLocaleString('tr-TR')}
                                            </span>
                                            <span className="mobile-card-id">
                                                #{msg.id}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </section>

                <div className="side-sections">
                    <section className="logs-section">
                        <h2>📋 Sistem Olayları</h2>
                        <div className="logs-list">
                            {logs.map((log, index) => (
                                <div key={index} className={`log-item log-${log.type}`}>
                                    <div className="log-header">
                                        <span className="log-type">{log.type}</span>
                                        <span className="log-time">
                                            {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                                        </span>
                                    </div>
                                    <div className="log-message">{log.message}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="stats-section">
                        <h2>📊 Bölüm İstatistikleri</h2>
                        <div className="stats-list">
                            {Object.entries(status.messagesBySection || {}).map(([section, count]) => (
                                <div key={section} className="stat-row">
                                    <span className="stat-name">{sectionTitles[section]}</span>
                                    <span className="stat-count">{count} mesaj</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
