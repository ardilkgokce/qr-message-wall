import React, { useState } from 'react';
import './TabletQRDisplay.css';

function TabletQRDisplay() {
    const [flippedCards, setFlippedCards] = useState({});

    const sections = {
        section1: { title: 'ORTAK GELECEK', logo: '/assets/ortak-gelecek.png' },
        section2: { title: 'İŞ BİRLİĞİ & HİKAYE', logo: '/assets/is-birligi-hikaye.png' },
        section3: { title: 'MERAK & CESARET', logo: '/assets/merak-cesaret.png' },
        section4: { title: 'TEKNOLOJİ', logo: '/assets/teknoloji.png' },
        section5: { title: 'MÜŞTERİ DENEYİMİ', logo: '/assets/musteri-deneyimi.png' }
    };

    const handleCardClick = (key) => {
        setFlippedCards(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="tablet-qr-screen">
            <div className="tablet-qr-header">
                <h1>
                    <span className="title-blue">BENİM PRENSİBİM</span>{' '}
                    <span className="title-green">DUVARI</span>
                </h1>
                <p>Karta dokunarak QR kodunu görüntüleyin</p>
            </div>

            <div className="tablet-qr-grid">
                {Object.entries(sections).map(([key, info]) => (
                    <div
                        key={key}
                        className={`tablet-qr-card ${flippedCards[key] ? 'flipped' : ''}`}
                        onClick={() => handleCardClick(key)}
                    >
                        <div className="card-inner">
                            {/* Ön Yüz - Logo ve Başlık */}
                            <div className="card-front">
                                <img
                                    src={info.logo}
                                    alt={info.title}
                                    className="tablet-qr-logo"
                                />
                                <h2 className="tablet-qr-title">{info.title}</h2>
                                <span className="tap-hint">Dokun</span>
                            </div>

                            {/* Arka Yüz - QR Kod */}
                            <div className="card-back">
                                <h3 className="card-back-title">{info.title}</h3>
                                <div className="tablet-qr-code">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/send/' + key)}`}
                                        alt={`QR - ${info.title}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TabletQRDisplay;
