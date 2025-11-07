import React from 'react';
import { Link } from 'react-router-dom';

function QRCodeDisplay() {
    const sections = {
        section1: { title: '🎉 Kutlamalar', color: '#FF6B6B' },
        section2: { title: '💭 Dilekler', color: '#4ECDC4' },
        section3: { title: '💡 Fikirler', color: '#45B7D1' },
        section4: { title: '❤️ Teşekkürler', color: '#96CEB4' },
        section5: { title: '📢 Duyurular', color: '#FECA57' }
    };

    return (
        <div style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
            <h1 style={{ color: 'white', marginBottom: '40px' }}>QR Kodları - Mesaj Gönder</h1>
            <Link to="/" style={{ color: 'white', fontSize: '18px' }}>← Ana Ekrana Dön</Link>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '40px', maxWidth: '1200px', margin: '40px auto' }}>
                {Object.entries(sections).map(([key, info]) => (
                    <div key={key} style={{ background: 'white', padding: '20px', borderRadius: '15px', border: `3px solid ${info.color}` }}>
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