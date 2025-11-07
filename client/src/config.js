// Ortam deðiþkenine göre veya otomatik olarak backend URL'ini belirle
const getBackendUrl = () => {
    // Eðer localhost'ta deðilsek, ayný host'u kullan
    if (window.location.hostname !== 'localhost') {
        return `http://${window.location.hostname}:3001`;
    }
    // Localhost'ta ise
    return 'http://localhost:3001';
};

export const BACKEND_URL = getBackendUrl();