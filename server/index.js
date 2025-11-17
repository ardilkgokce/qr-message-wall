const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Express app olu�tur
const app = express();
const server = http.createServer(app);

// Socket.io ayarlar�
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware'ler
app.use(cors());
app.use(express.json());

// Port ayar�
const PORT = process.env.PORT || 3001;

// Mesajlar� tutacak obje (5 b�l�m i�in)
let messages = {
    section1: [],
    section2: [],
    section3: [],
    section4: [],
    section5: []
};

// Sistem logları (admin panel için)
let systemLogs = [];
let activeConnections = 0;

// Log ekle fonksiyonu
function addLog(type, message, data = {}) {
    systemLogs.unshift({
        type,
        message,
        data,
        timestamp: new Date()
    });
    // Son 50 log'u tut
    if (systemLogs.length > 50) {
        systemLogs = systemLogs.slice(0, 50);
    }
}

// Basit test endpoint'i
app.get('/', (req, res) => {
    res.json({ message: 'QR Message Wall Server çalışıyor!' });
});

// ===== ADMIN API ENDPOINTS =====

// Tüm mesajları getir (admin panel için)
app.get('/api/admin/messages', (req, res) => {
    const allMessages = [];
    Object.keys(messages).forEach(section => {
        messages[section].forEach(msg => {
            allMessages.push({
                ...msg,
                section
            });
        });
    });
    res.json(allMessages);
});

// Tek mesaj sil
app.delete('/api/admin/message/:section/:id', (req, res) => {
    const { section, id } = req.params;

    if (!messages[section]) {
        return res.status(404).json({ error: 'Bölüm bulunamadı' });
    }

    const messageIndex = messages[section].findIndex(msg => msg.id == id);

    if (messageIndex === -1) {
        return res.status(404).json({ error: 'Mesaj bulunamadı' });
    }

    const deletedMessage = messages[section].splice(messageIndex, 1)[0];

    // Log ekle
    addLog('delete', 'Mesaj silindi', { section, id, author: deletedMessage.author });

    // Tüm clientlara bildir
    io.emit('message-deleted', { section, id });

    res.json({ success: true, message: 'Mesaj silindi' });
});

// Bölümdeki tüm mesajları sil
app.delete('/api/admin/messages/:section', (req, res) => {
    const { section } = req.params;

    if (!messages[section]) {
        return res.status(404).json({ error: 'Bölüm bulunamadı' });
    }

    const count = messages[section].length;
    messages[section] = [];

    // Log ekle
    addLog('delete-section', `${section} bölümündeki tüm mesajlar silindi`, { section, count });

    // Tüm clientlara bildir
    io.emit('section-cleared', { section });

    res.json({ success: true, message: `${count} mesaj silindi` });
});

// Tüm mesajları temizle
app.post('/api/admin/messages/clear-all', (req, res) => {
    let totalCount = 0;
    Object.keys(messages).forEach(section => {
        totalCount += messages[section].length;
        messages[section] = [];
    });

    // Log ekle
    addLog('clear-all', 'Tüm mesajlar silindi', { count: totalCount });

    // Tüm clientlara bildir
    io.emit('all-messages-cleared');

    res.json({ success: true, message: `${totalCount} mesaj silindi` });
});

// Sistem durumu
app.get('/api/admin/status', (req, res) => {
    const stats = {
        activeConnections,
        messagesBySection: {},
        totalMessages: 0,
        lastActivity: systemLogs.length > 0 ? systemLogs[0].timestamp : null
    };

    Object.keys(messages).forEach(section => {
        stats.messagesBySection[section] = messages[section].length;
        stats.totalMessages += messages[section].length;
    });

    res.json(stats);
});

// Sistem loglarını getir
app.get('/api/admin/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    res.json(systemLogs.slice(0, limit));
});

// ===== MESAJ ONAY/RED SİSTEMİ =====

// Tek mesajı onayla
app.post('/api/admin/message/:section/:id/approve', (req, res) => {
    const { section, id } = req.params;

    if (!messages[section]) {
        return res.status(404).json({ error: 'Bölüm bulunamadı' });
    }

    const message = messages[section].find(msg => msg.id == id);

    if (!message) {
        return res.status(404).json({ error: 'Mesaj bulunamadı' });
    }

    // Mesajı onayla
    message.status = 'approved';

    // Log ekle
    addLog('approve', 'Mesaj onaylandı', { section, id, author: message.author });

    // Tüm clientlara onaylanmış mesajı bildir (ekranda gösterilecek)
    io.emit('message-approved', { section, message });

    res.json({ success: true, message: 'Mesaj onaylandı' });
});

// Tek mesajı reddet
app.post('/api/admin/message/:section/:id/reject', (req, res) => {
    const { section, id } = req.params;

    if (!messages[section]) {
        return res.status(404).json({ error: 'Bölüm bulunamadı' });
    }

    const messageIndex = messages[section].findIndex(msg => msg.id == id);

    if (messageIndex === -1) {
        return res.status(404).json({ error: 'Mesaj bulunamadı' });
    }

    const rejectedMessage = messages[section].splice(messageIndex, 1)[0];

    // Log ekle
    addLog('reject', 'Mesaj reddedildi', { section, id, author: rejectedMessage.author });

    // Admin panele bildir (mesaj tamamen silindi)
    io.emit('message-rejected', { section, id });

    res.json({ success: true, message: 'Mesaj reddedildi' });
});

// Toplu mesaj onayla
app.post('/api/admin/messages/approve-bulk', (req, res) => {
    const { messageIds } = req.body; // [{ section, id }, ...]

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ error: 'Geçersiz mesaj listesi' });
    }

    let approvedCount = 0;
    const approvedMessages = [];

    messageIds.forEach(({ section, id }) => {
        if (messages[section]) {
            const message = messages[section].find(msg => msg.id == id);
            if (message) {
                message.status = 'approved';
                approvedMessages.push({ section, message });
                approvedCount++;
            }
        }
    });

    // Log ekle
    addLog('approve-bulk', `${approvedCount} mesaj toplu onaylandı`, { count: approvedCount });

    // Her onaylanan mesajı ayrı ayrı bildir
    approvedMessages.forEach(({ section, message }) => {
        io.emit('message-approved', { section, message });
    });

    res.json({ success: true, message: `${approvedCount} mesaj onaylandı`, count: approvedCount });
});

// Toplu mesaj reddet
app.post('/api/admin/messages/reject-bulk', (req, res) => {
    const { messageIds } = req.body; // [{ section, id }, ...]

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return res.status(400).json({ error: 'Geçersiz mesaj listesi' });
    }

    let rejectedCount = 0;
    const rejectedIds = [];

    messageIds.forEach(({ section, id }) => {
        if (messages[section]) {
            const messageIndex = messages[section].findIndex(msg => msg.id == id);
            if (messageIndex !== -1) {
                messages[section].splice(messageIndex, 1);
                rejectedIds.push({ section, id });
                rejectedCount++;
            }
        }
    });

    // Log ekle
    addLog('reject-bulk', `${rejectedCount} mesaj toplu reddedildi`, { count: rejectedCount });

    // Her reddedilen mesajı ayrı ayrı bildir
    rejectedIds.forEach(({ section, id }) => {
        io.emit('message-rejected', { section, id });
    });

    res.json({ success: true, message: `${rejectedCount} mesaj reddedildi`, count: rejectedCount });
});

// Pending mesaj sayısını getir
app.get('/api/admin/messages/pending', (req, res) => {
    let pendingCount = 0;
    const pendingMessages = [];

    Object.keys(messages).forEach(section => {
        messages[section].forEach(msg => {
            if (msg.status === 'pending') {
                pendingCount++;
                pendingMessages.push({
                    ...msg,
                    section
                });
            }
        });
    });

    res.json({ count: pendingCount, messages: pendingMessages });
});

// Socket bağlantıları
io.on('connection', (socket) => {
    activeConnections++;
    console.log('Yeni kullanıcı bağlandı:', socket.id);

    // Log ekle
    addLog('connection', 'Yeni bağlantı', { socketId: socket.id, total: activeConnections });

    // İlk bağlantıda mevcut mesajları gönder
    socket.emit('initial-messages', messages);

    // Yeni mesaj geldiğinde
    socket.on('new-message', (data) => {
        const { section, text, author } = data;

        // Basit validasyon
        if (!text || !section || !messages[section]) {
            return;
        }

        // Mesajı oluştur
        const newMessage = {
            id: Date.now(),
            text: text.substring(0, 280), // Max 280 karakter
            author: author || 'Anonim',
            timestamp: new Date(),
            status: 'pending' // Yeni mesajlar onay bekliyor
        };

        // Mesajı ilgili bölüme ekle
        messages[section].push(newMessage);

        // Son 50 mesajı tut (performans için)
        if (messages[section].length > 50) {
            messages[section] = messages[section].slice(-50);
        }

        // Admin panele pending mesaj olarak bildir (ekranda gösterilmez)
        io.emit('pending-message-added', { section, message: newMessage });

        // Log ekle
        addLog('new-message', 'Yeni mesaj eklendi', {
            section,
            author: newMessage.author,
            textLength: newMessage.text.length
        });

        console.log(`Yeni mesaj - Bölüm: ${section}, Yazar: ${newMessage.author}`);
    });

    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
        activeConnections--;
        console.log('Kullanıcı ayrıldı:', socket.id);

        // Log ekle
        addLog('disconnect', 'Bağlantı koptu', { socketId: socket.id, total: activeConnections });
    });
});

// Server'� ba�lat
server.listen(PORT, () => {
    console.log(`Server ${PORT} portunda �al���yor`);
    console.log(`http://localhost:${PORT}`);
});