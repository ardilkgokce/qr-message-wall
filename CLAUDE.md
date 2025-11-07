# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QR Message Wall is a real-time event messaging application that allows participants to send messages to a public display by scanning QR codes. The application consists of two parts:

- **Server**: Node.js/Express backend with Socket.IO for real-time communication
- **Client**: React frontend (Create React App) with routing and Socket.IO client

## Architecture

### Client-Server Communication
The application uses Socket.IO for bidirectional real-time communication:
- Server broadcasts messages to all connected clients via the `message-added` event
- Clients emit new messages via the `new-message` event
- Initial message state is sent via `initial-messages` on connection

### Message Flow
1. Users scan a section-specific QR code with their mobile device
2. QR code navigates to `/send/:section` route
3. User submits message through `MobileForm` component
4. Message is emitted to server via Socket.IO
5. Server validates, stores (in-memory), and broadcasts to all clients
6. `DisplayScreen` component updates in real-time to show new messages

### Sections System
The application organizes messages into 5 predefined sections:
- `section1`: Kutlamalar (Celebrations) - #FF6B6B
- `section2`: Dilekler (Wishes) - #4ECDC4
- `section3`: Fikirler (Ideas) - #45B7D1
- `section4`: Teşekkürler (Thanks) - #96CEB4
- `section5`: Duyurular (Announcements) - #FECA57

Each section has consistent title, emoji, and color across components (DisplayScreen.js, MobileForm.js, QRCodeDisplay.js).

### Routes
- `/` - Main display screen showing all messages (DisplayScreen)
- `/qr-codes` - Page displaying all QR codes (QRCodeDisplay)
- `/send/:section` - Mobile form for sending messages to specific section (MobileForm)

### Backend URL Configuration
The client uses a dynamic backend URL configuration (config.js) that automatically adjusts based on environment:
- Localhost: `http://localhost:3001`
- Production: Uses current hostname with port 3001

### Data Storage
Messages are stored in-memory on the server (server/index.js:26-32). Each section stores up to 50 messages. Data is lost on server restart.

## Development Commands

### Server
```bash
cd server
npm install        # Install dependencies
npm start         # Run server (production mode)
npm run dev       # Run server with nodemon (auto-reload)
```
Server runs on port 3001 (configurable via PORT env var).

### Client
```bash
cd client
npm install        # Install dependencies
npm start         # Start dev server (http://localhost:3000)
npm test          # Run tests in watch mode
npm run build     # Build for production
```

### Running Both
To develop, run both server and client simultaneously in separate terminals:
1. Terminal 1: `cd server && npm run dev`
2. Terminal 2: `cd client && npm start`

## Key Implementation Details

### Message Structure
```javascript
{
  id: Date.now(),
  text: string,        // Max 280 characters
  author: string,      // Default: "Anonim" or "Misafir"
  timestamp: Date
}
```

### Socket.IO Events
- **Client → Server**: `new-message` with `{ section, text, author }`
- **Server → Client**: `message-added` with `{ section, message }`
- **Server → Client**: `initial-messages` with full messages object on connection

### QR Code Generation
QR codes are generated using the external API `https://api.qrserver.com/v1/create-qr-code/` with URLs pointing to `/send/:section` routes.

## Important Notes

- The application is in Turkish (comments, UI text, section names)
- No database - messages are stored in-memory only
- CORS is enabled for all origins (`*`) - consider restricting in production
- Display screen shows only the last 10 messages per section (client\src\components\DisplayScreen.js:107)
- Server limits each section to 50 messages for performance (server\index.js:67-69)
- Character limits: message text (280), author name (50)
