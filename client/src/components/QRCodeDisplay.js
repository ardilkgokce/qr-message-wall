import React from 'react';
import { Link } from 'react-router-dom';

function QRCodeDisplay() {
    const sections = {
        section1: { title: 'ORTAK GELECEK', color: '#2655b5', logo: '/assets/ortak-gelecek.png' },
        section2: { title: 'İŞ BİRLİĞİ & HİKAYE', color: '#2655b5', logo: '/assets/is-birligi-hikaye.png' },
        section3: { title: 'MERAK & CESARET', color: '#2655b5', logo: '/assets/merak-cesaret.png' },
        section4: { title: 'TEKNOLOJİ', color: '#2655b5', logo: '/assets/teknoloji.png' },
        section5: { title: 'MÜŞTERİ DENEYİMİ', color: '#2655b5', logo: '/assets/musteri-deneyimi.png' }
    };

    return (
        <div style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, #2655b5 0%, #84ba29 100%)', minHeight: '100vh' }}>
            <h1 style={{ color: 'white', marginBottom: '40px' }}>QR Kodları - Mesaj Gönder</h1>
            <Link to="/" style={{ color: 'white', fontSize: '18px' }}>← Ana Ekrana Dön</Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '40px', maxWidth: '1200px', margin: '40px auto' }}>
                {Object.entries(sections).map(([key, info]) => (
                    <div key={key} style={{ background: 'white', padding: '20px', borderRadius: '15px', border: `3px solid ${info.color}` }}>
                        <img
                            src={info.logo}
                            alt={info.title}
                            style={{ width: '60px', height: '60px', margin: '0 auto 15px', display: 'block' }}
                        />
                        <h2 style={{ color: info.color }}>{info.title}</h2>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/send/' + key)}`}
                            alt={`QR for ${info.title}`}
                            style={{ width: '100%', maxWidth: '200px', margin: '20px auto', display: 'block' }}
                        />
                        <p style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                            {window.location.origin}/send/{key}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default QRCodeDisplay;