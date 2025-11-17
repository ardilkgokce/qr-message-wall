import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { BACKEND_URL } from '../config'; // Bu satırı ekle
import './DisplayScreen.css';

function DisplayScreen() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState({
        section1: [],
        section2: [],
        section3: [],
        section4: [],
        section5: []
    });
    const [overflowSections, setOverflowSections] = useState({
        section1: false,
        section2: false,
        section3: false,
        section4: false,
        section5: false
    });

    // Body'ye display-page class'ı ekle (overflow:hidden için)
    useEffect(() => {
        document.body.classList.add('display-page');
        return () => {
            document.body.classList.remove('display-page');
        };
    }, []);

    useEffect(() => {
        const newSocket = io(BACKEND_URL); // Burayı değiştir
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Display ekranı bağlandı!');
        });

        newSocket.on('initial-messages', (initialMessages) => {
            // Sadece onaylanmış mesajları göster
            const approvedMessages = {};
            Object.keys(initialMessages).forEach(section => {
                approvedMessages[section] = initialMessages[section].filter(msg => msg.status === 'approved');
            });
            setMessages(approvedMessages);
        });

        // Onaylanan mesajlar ekranda görünür
        newSocket.on('message-approved', ({ section, message }) => {
            setMessages(prevMessages => ({
                ...prevMessages,
                [section]: [...prevMessages[section], message]
            }));
        });

        // Mesaj silindiğinde
        newSocket.on('message-deleted', ({ section, id }) => {
            setMessages(prevMessages => ({
                ...prevMessages,
                [section]: prevMessages[section].filter(msg => msg.id != id)
            }));
        });

        // Bölümdeki tüm mesajlar silindiğinde
        newSocket.on('section-cleared', ({ section }) => {
            setMessages(prevMessages => ({
                ...prevMessages,
                [section]: []
            }));
        });

        // Tüm mesajlar silindiğinde
        newSocket.on('all-messages-cleared', () => {
            setMessages({
                section1: [],
                section2: [],
                section3: [],
                section4: [],
                section5: []
            });
        });

        return () => newSocket.close();
    }, []);

    // Ekran aspect ratio kontrolü
    useEffect(() => {
        const checkAspectRatio = () => {
            const ratio = window.innerWidth / window.innerHeight;
            const is16by9 = Math.abs(ratio - (16/9)) < 0.1; // Toleranslı kontrol (±0.1)

            if (is16by9) {
                document.body.classList.add('aspect-16-9');
            } else {
                document.body.classList.remove('aspect-16-9');
            }
        };

        checkAspectRatio();
        window.addEventListener('resize', checkAspectRatio);

        return () => window.removeEventListener('resize', checkAspectRatio);
    }, []);

    // Mesajlar değiştiğinde overflow kontrolü yap (threshold ve debouncing ile)
    useEffect(() => {
        let debounceTimer;

        const checkOverflow = () => {
            const newOverflowState = {};

            Object.keys(messages).forEach(sectionKey => {
                const container = document.querySelector(`[data-section="${sectionKey}"] .messages-list`);
                const scroll = document.querySelector(`[data-section="${sectionKey}"] .messages-scroll`);

                if (container && scroll && messages[sectionKey].length > 0) {
                    // Container yüksekliği ile içerik yüksekliğini karşılaştır
                    const containerHeight = container.clientHeight;
                    const scrollHeight = scroll.scrollHeight;

                    // Threshold bazlı kontrol: %80'den fazlasını dolduruyorsa animasyonu çalıştır
                    // Bu sayede tam ekranda mesajlar "neredeyse sığsa bile" animasyon çalışır
                    const threshold = containerHeight * 0.8;
                    newOverflowState[sectionKey] = scrollHeight > threshold;
                } else {
                    newOverflowState[sectionKey] = false;
                }
            });

            setOverflowSections(newOverflowState);
        };

        // Layout'un oturması için 500ms gecikme (fullscreen geçişleri için önemli)
        const timer = setTimeout(checkOverflow, 500);

        // Debounced resize handler - hızlı resize'larda sürekli kontrol etmeyi engelle
        const debouncedCheckOverflow = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(checkOverflow, 300);
        };

        window.addEventListener('resize', debouncedCheckOverflow);

        return () => {
            clearTimeout(timer);
            clearTimeout(debounceTimer);
            window.removeEventListener('resize', debouncedCheckOverflow);
        };
    }, [messages]);

    const sectionTitles = {
        section1: 'ORTAK GELECEK',
        section2: 'İŞ BİRLİĞİ & HİKAYE',
        section3: 'MERAK & CESARET',
        section4: 'TEKNOLOJİ',
        section5: 'MÜŞTERİ DENEYİMİ'
    };

    const sectionLogos = {
        section1: '/assets/ortak-gelecek.png',
        section2: '/assets/is-birligi-hikaye.png',
        section3: '/assets/merak-cesaret.png',
        section4: '/assets/teknoloji.png',
        section5: '/assets/musteri-deneyimi.png'
    };

    return (
        <div className="display-screen">
            {/* Header */}
            <header className="display-header">
                <h1>BENİM PRENSİBİM DUVARI</h1>
            </header>

            {/* Mesaj Bölümleri */}
            <div className="sections-container">
                {Object.entries(messages).map(([sectionKey, sectionMessages]) => (
                    <div key={sectionKey} className="section-column" data-section={sectionKey}>
                        <div className="section-wrapper">
                            <div className="message-section">
                            <h2>
                                <img
                                    src={sectionLogos[sectionKey]}
                                    alt={sectionTitles[sectionKey]}
                                    className="section-logo"
                                />
                                {sectionTitles[sectionKey]}
                            </h2>
                            <div className="messages-list">
                                {sectionMessages.length === 0 ? (
                                    <p className="no-messages">Mesaj bekleniyor...</p>
                                ) : (
                                    <div className={`messages-scroll ${overflowSections[sectionKey] ? 'has-overflow' : ''}`}>
                                        {/* İlk mesaj seti (her zaman göster) */}
                                        {sectionMessages.slice(-10).map((msg) => (
                                            <div key={`first-${msg.id}`} className="message-item">
                                                <div className="message-author">{msg.author}</div>
                                                <div className="message-text">{msg.text}</div>
                                                <div className="message-time">
                                                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}
                                        {/* İkinci mesaj seti (sadece overflow varsa - seamless loop için) */}
                                        {overflowSections[sectionKey] && sectionMessages.slice(-10).map((msg) => (
                                            <div key={`second-${msg.id}`} className="message-item">
                                                <div className="message-author">{msg.author}</div>
                                                <div className="message-text">{msg.text}</div>
                                                <div className="message-time">
                                                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            </div>
                        </div>

                        {/* Section QR Code - Outside of section-wrapper */}
                        <div className="section-qr-code">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.origin + '/send/' + sectionKey)}`}
                                alt={`QR kod - ${sectionTitles[sectionKey]}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DisplayScreen;