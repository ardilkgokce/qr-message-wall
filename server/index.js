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
            timestamp: new Date()
        };

        // Mesajı ilgili bölüme ekle
        messages[section].push(newMessage);

        // Son 50 mesajı tut (performans için)
        if (messages[section].length > 50) {
            messages[section] = messages[section].slice(-50);
        }

        // Tüm kullanıcılara yayınla
        io.emit('message-added', { section, message: newMessage });

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