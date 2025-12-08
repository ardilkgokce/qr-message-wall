import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { BACKEND_URL } from '../config';
import './KioskScreen.css';

function KioskScreen() {
    const { section } = useParams();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [authorName, setAuthorName] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    // section yoksa default olarak section1 kullan
    const currentSectionKey = section || 'section1';

    const sectionInfo = {
        section1: { title: 'ORTAK GELECEK', color: '#2655b5', logo: '/assets/ortak-gelecek.png' },
        section2: { title: 'İŞ BİRLİĞİ & HİKAYE', color: '#84ba29', logo: '/assets/is-birligi-hikaye.png' },
        section3: { title: 'MERAK & CESARET', color: '#2655b5', logo: '/assets/merak-cesaret.png' },
        section4: { title: 'TEKNOLOJİ', color: '#84ba29', logo: '/assets/teknoloji.png' },
        section5: { title: 'MÜŞTERİ DENEYİMİ', color: '#2655b5', logo: '/assets/musteri-deneyimi.png' }
    };

    const currentSection = sectionInfo[currentSectionKey] || sectionInfo.section1;

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
                section: currentSectionKey,
                text: message,
                author: authorName || 'Anonim'
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
        <div className="kiosk-screen" style={{ background: 'linear-gradient(135deg, #2655b5 0%, #84ba29 100%)' }}>
            <div className="kiosk-container">
                {/* Sol Kolon - Form */}
                <div className="kiosk-left">
                    <div className="kiosk-header">
                        <h2 className="kiosk-main-title">
                            <span className="title-blue">BENİM PRENSİBİM</span>{' '}
                            <span className="title-green">DUVARI</span>
                        </h2>
                        <img src={currentSection.logo} alt={currentSection.title} className="kiosk-section-logo" />
                        <h1>{currentSection.title}</h1>
                        <p>Mesajınızı bu bölüme gönderin</p>
                    </div>

                    {sent ? (
                        <div className="success-message">
                            <div className="success-icon">✅</div>
                            <h2>Mesajınız Gönderildi!</h2>
                            <p>Teşekkürler! 🙏</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="kiosk-form">
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
                                <button
                                    key={key}
                                    onClick={() => navigate(`/kiosk/${key}`)}
                                    className={`section-btn ${info.color === '#2655b5' ? 'btn-blue' : 'btn-green'} ${key === currentSectionKey ? 'active' : ''}`}
                                    style={{ backgroundColor: info.color }}
                                >
                                    <img src={info.logo} alt={info.title} className="section-btn-logo" />
                                    <span className="section-btn-text">{info.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sağ Kolon - Klavye Alanı */}
                <div className="kiosk-right">
                    {/* OS klavyesi buraya açılacak - boş alan */}
                </div>
            </div>
        </div>
    );
}

export default KioskScreen;
