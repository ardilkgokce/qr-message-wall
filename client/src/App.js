import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DisplayScreen from './components/DisplayScreen';
import MobileForm from './components/MobileForm';
import QRCodeDisplay from './components/QRCodeDisplay';
import AdminPanel from './components/AdminPanel';
import KioskScreen from './components/KioskScreen';
import TabletQRDisplay from './components/TabletQRDisplay';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Ana Ekran - Mesajları gösterir */}
                    <Route path="/" element={<DisplayScreen />} />

                    {/* QR Kodları göster */}
                    <Route path="/qr-codes" element={<QRCodeDisplay />} />

                    {/* Mobil Form - QR okutunca açılacak */}
                    <Route path="/send/:section" element={<MobileForm />} />

                    {/* Kiosk Ekranı - Dokunmatik ekran için */}
                    <Route path="/kiosk" element={<KioskScreen />} />
                    <Route path="/kiosk/:section" element={<KioskScreen />} />

                    {/* Tablet QR Ekranı - Tüm QR kodları */}
                    <Route path="/tablet-qr" element={<TabletQRDisplay />} />

                    {/* Admin Kontrol Paneli - ?key=admin123 ile erişim */}
                    <Route path="/admin" element={<AdminPanel />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;