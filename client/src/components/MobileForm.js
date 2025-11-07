import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { BACKEND_URL } from '../config';
import './MobileForm.css';

function MobileForm() {
    const { section } = useParams();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [authorName, setAuthorName] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const sectionInfo = {
        section1: { title: '🎉 Kutlamalar', color: '#FF6B6B' },
        section2: { title: '💭 Dilekler', color: '#4ECDC4' },
        section3: { title: '💡 Fikirler', color: '#45B7D1' },
        section4: { title: '❤️ Teşekkürler', color: '#96CEB4' },
        section5: { title: '📢 Duyurular', color: '#FECA57' }
    };

    const currentSection = sectionInfo[section] || sectionInfo.section1;

    useEffect(() => {
        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!message.trim()) {
            alert('Lütfen bir mesaj yazın!');
            return;
        }

        setSending(true);

        if (socket) {
            socket.emit('new-message', {
                section: section,
                text: message,
                author: authorName || 'Misafir'
            });

            setTimeout(() => {
                setSending(false);
                setSent(true);

                // 3 saniye sonra formu sıfırla
                setTimeout(() => {
                    setSent(false);
                    setMessage('');
                    setAuthorName('');
                }, 3000);
            }, 500);
        }
    };

    return (
        <div className="mobile-form" style={{ background: `linear-gradient(135deg, ${currentSection.color}dd, ${currentSection.color}99)` }}>
            <div className="mobile-container">
                <div className="mobile-header">
                    <h1>{currentSection.title}</h1>
                    <p>Mesajınızı bu bölüme gönderin</p>
                </div>

                {sent ? (
                    <div className="success-message">
                        <div className="success-icon">✅</div>
                        <h2>Mesajınız Gönderildi!</h2>
                        <p>Mesajınız ekranda görünecek</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="message-form">
                        <div className="form-group">
                            <label>İsminiz (İsteğe Bağlı)</label>
                            <input
                                type="text"
                                placeholder="Adınızı yazın..."
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                maxLength={50}
                                disabled={sending}
                            />
                        </div>

                        <div className="form-group">
                            <label>Mesajınız *</label>
                            <textarea
                                placeholder="Mesajınızı buraya yazın..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                maxLength={280}
                                rows={5}
                                required
                                disabled={sending}
                            />
                            <div className="char-count">
                                {message.length}/280 karakter
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={sending || !message.trim()}
                            style={{ backgroundColor: currentSection.color }}
                        >
                            {sending ? '📤 Gönderiliyor...' : '📩 Mesajı Gönder'}
                        </button>
                    </form>
                )}

                <div className="other-sections">
                    <p>Farklı bir bölüme mesaj göndermek ister misiniz?</p>
                    <div className="section-buttons">
                        {Object.entries(sectionInfo).map(([key, info]) => (
                            key !== section && (
                                <button
                                    key={key}
                                    onClick={() => navigate(`/send/${key}`)}
                                    className="section-btn"
                                    style={{ backgroundColor: info.color }}
                                >
                                    {info.title}
                                </button>
                            )
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MobileForm;