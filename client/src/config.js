// Ortam deðiþkenine göre veya otomatik olarak backend URL'ini belirle
const getBackendUrl = () => {
    // BURAYA RAILWAY'DEN ALDIÐIN URL'YÝ YAZ
    const PRODUCTION_URL = 'https://qr-message-wall-production.up.railway.app';

    if (window.location.hostname === 'localhost') {
        return 'http://localhost:3001';
    }

    return PRODUCTION_URL;
};

export const BACKEND_URL = getBackendUrl();