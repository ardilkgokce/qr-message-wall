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
    const [activeTab, setActiveTab] = useState('pending'); // 'all', 'pending', 'approved'
    const [pendingCount, setPendingCount] = useState(0);

    const sectionTitles = {
        section1: '🤝 ORTAK GELECEK',
        section2: '👥 İŞ BİRLİĞİ & HİKAYE',
        section3: '➡️ MERAK & CESARET',
        section4: '⚡ TEKNOLOJİ',
        section5: '❤️ MÜŞTERİ DENEYİMİ'
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
        newSocket.on('pending-message-added', () => {
            fetchMessages();
            fetchStatus();
            fetchPendingCount();
        });

        newSocket.on('message-approved', () => {
            fetchMessages();
            fetchStatus();
            fetchPendingCount();
        });

        newSocket.on('message-rejected', () => {
            fetchMessages();
            fetchStatus();
            fetchPendingCount();
        });

        newSocket.on('message-deleted', () => {
            fetchMessages();
            fetchStatus();
            fetchPendingCount();
        });

        newSocket.on('section-cleared', () => {
            fetchMessages();
            fetchStatus();
            fetchPendingCount();
        });

        newSocket.on('all-messages-cleared', () => {
            fetchMessages();
            fetchStatus();
            fetchPendingCount();
        });

        return () => newSocket.close();
    }, []);

    // İlk yükleme
    useEffect(() => {
        fetchMessages();
        fetchStatus();
        fetchLogs();
        fetchPendingCount();

        // Her 5 saniyede bir status ve log güncelle
        const interval = setInterval(() => {
            fetchStatus();
            fetchLogs();
            fetchPendingCount();
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

    const fetchPendingCount = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/messages/pending`);
            const data = await response.json();
            setPendingCount(data.count);
        } catch (error) {
            console.error('Pending sayısı yüklenemedi:', error);
        }
    };

    const approveMessage = async (section, id) => {
        try {
            await fetch(`${BACKEND_URL}/api/admin/message/${section}/${id}/approve`, {
                method: 'POST'
            });
            fetchMessages();
            fetchStatus();
            fetchLogs();
            fetchPendingCount();
        } catch (error) {
            console.error('Mesaj onaylanamadı:', error);
        }
    };

    const rejectMessage = async (section, id) => {
        if (!window.confirm('Bu mesajı reddetmek istediğinizden emin misiniz? Mesaj kalıcı olarak silinecek.')) {
            return;
        }

        try {
            await fetch(`${BACKEND_URL}/api/admin/message/${section}/${id}/reject`, {
                method: 'POST'
            });
            fetchMessages();
            fetchStatus();
            fetchLogs();
            fetchPendingCount();
        } catch (error) {
            console.error('Mesaj reddedilemedi:', error);
        }
    };

    const approveSelected = async () => {
        if (selectedMessages.length === 0) {
            alert('Lütfen onaylamak için mesaj seçin');
            return;
        }

        try {
            const messageIds = selectedMessages.map(msgId => {
                const message = messages.find(m => m.id === msgId);
                return { section: message.section, id: message.id };
            });

            await fetch(`${BACKEND_URL}/api/admin/messages/approve-bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageIds })
            });

            setSelectedMessages([]);
            fetchMessages();
            fetchStatus();
            fetchLogs();
            fetchPendingCount();
        } catch (error) {
            console.error('Mesajlar onaylanamadı:', error);
        }
    };

    const rejectSelected = async () => {
        if (selectedMessages.length === 0) {
            alert('Lütfen reddetmek için mesaj seçin');
            return;
        }

        if (!window.confirm(`${selectedMessages.length} mesajı reddetmek istediğinizden emin misiniz? Mesajlar kalıcı olarak silinecek.`)) {
            return;
        }

        try {
            const messageIds = selectedMessages.map(msgId => {
                const message = messages.find(m => m.id === msgId);
                return { section: message.section, id: message.id };
            });

            await fetch(`${BACKEND_URL}/api/admin/messages/reject-bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageIds })
            });

            setSelectedMessages([]);
            fetchMessages();
            fetchStatus();
            fetchLogs();
            fetchPendingCount();
        } catch (error) {
            console.error('Mesajlar reddedilemedi:', error);
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
        if (selectedMessages.length === filteredMessages.length) {
            setSelectedMessages([]);
        } else {
            setSelectedMessages(filteredMessages.map(m => m.id));
        }
    };

    // Mesajları tab'e göre filtrele ve en yeni önce sırala
    const filteredMessages = messages
        .filter(msg => {
            if (activeTab === 'all') return true;
            if (activeTab === 'pending') return msg.status === 'pending';
            if (activeTab === 'approved') return msg.status === 'approved';
            return true;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // En yeni önce

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
                    {/* Tab Navigation */}
                    <div className="tabs-navigation">
                        <button
                            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            ⏳ Onay Bekleyenler
                            {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                            onClick={() => setActiveTab('approved')}
                        >
                            ✅ Onaylananlar
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            📋 Tüm Mesajlar
                        </button>
                    </div>

                    <div className="section-header">
                        <h2>
                            {activeTab === 'pending' && `⏳ Onay Bekleyen Mesajlar (${filteredMessages.length})`}
                            {activeTab === 'approved' && `✅ Onaylanan Mesajlar (${filteredMessages.length})`}
                            {activeTab === 'all' && `📋 Tüm Mesajlar (${filteredMessages.length})`}
                        </h2>
                        <div className="table-controls">
                            {activeTab === 'pending' ? (
                                <>
                                    <button
                                        onClick={approveSelected}
                                        className="btn-success"
                                        disabled={selectedMessages.length === 0}
                                    >
                                        ✅ Seçilenleri Onayla ({selectedMessages.length})
                                    </button>
                                    <button
                                        onClick={rejectSelected}
                                        className="btn-danger"
                                        disabled={selectedMessages.length === 0}
                                    >
                                        ❌ Seçilenleri Reddet ({selectedMessages.length})
                                    </button>
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
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
                                            checked={selectedMessages.length === filteredMessages.length && filteredMessages.length > 0}
                                            onChange={toggleAllSelection}
                                        />
                                    </th>
                                    <th>Bölüm</th>
                                    <th>Gönderen</th>
                                    <th>Mesaj</th>
                                    <th>Durum</th>
                                    <th>Tarih/Saat</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMessages.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="no-data">
                                            {activeTab === 'pending' && 'Onay bekleyen mesaj yok'}
                                            {activeTab === 'approved' && 'Henüz onaylanmış mesaj yok'}
                                            {activeTab === 'all' && 'Henüz mesaj yok'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMessages.map(msg => (
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
                                            <td>
                                                <span className={`status-badge status-${msg.status}`}>
                                                    {msg.status === 'pending' ? '⏳ Bekliyor' : '✅ Onaylı'}
                                                </span>
                                            </td>
                                            <td className="date-cell">
                                                {new Date(msg.timestamp).toLocaleString('tr-TR')}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {msg.status === 'pending' ? (
                                                        <>
                                                            <button
                                                                onClick={() => approveMessage(msg.section, msg.id)}
                                                                className="btn-approve"
                                                                title="Onayla"
                                                            >
                                                                ✅
                                                            </button>
                                                            <button
                                                                onClick={() => rejectMessage(msg.section, msg.id)}
                                                                className="btn-reject"
                                                                title="Reddet"
                                                            >
                                                                ❌
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => deleteMessage(msg.section, msg.id)}
                                                            className="btn-delete"
                                                            title="Sil"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="mobile-messages-list">
                        {filteredMessages.length === 0 ? (
                            <div className="mobile-no-messages">
                                {activeTab === 'pending' && 'Onay bekleyen mesaj yok'}
                                {activeTab === 'approved' && 'Henüz onaylanmış mesaj yok'}
                                {activeTab === 'all' && 'Henüz mesaj yok'}
                            </div>
                        ) : (
                            <>
                                <div className="mobile-select-all">
                                    <input
                                        type="checkbox"
                                        checked={selectedMessages.length === filteredMessages.length}
                                        onChange={toggleAllSelection}
                                        id="mobile-select-all"
                                    />
                                    <label htmlFor="mobile-select-all">
                                        Tümünü Seç ({filteredMessages.length})
                                    </label>
                                </div>
                                {filteredMessages.map(msg => (
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
                                                <span className={`status-badge status-${msg.status}`}>
                                                    {msg.status === 'pending' ? '⏳' : '✅'}
                                                </span>
                                            </div>
                                            <div className="mobile-action-buttons">
                                                {msg.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => approveMessage(msg.section, msg.id)}
                                                            className="mobile-approve-btn"
                                                            title="Onayla"
                                                        >
                                                            ✅
                                                        </button>
                                                        <button
                                                            onClick={() => rejectMessage(msg.section, msg.id)}
                                                            className="mobile-reject-btn"
                                                            title="Reddet"
                                                        >
                                                            ❌
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => deleteMessage(msg.section, msg.id)}
                                                        className="mobile-delete-btn"
                                                        title="Sil"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
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
