# Chat App Frontend

React + Vite frontend for the Chat Application.

## Features

- 🔐 User Authentication (Login/Signup)
- 💬 Real-time Chat with WebSocket
- 📱 Fully Responsive Design (Mobile, Tablet, Desktop)
- 🎨 Modern UI with CSS Modules
- 🔄 Axios for API Communication
- 🌐 Environment Configuration

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values if needed:
     ```
     VITE_API_BASE_URL=http://localhost:8080
     VITE_WS_URL=ws://localhost:6789
     ```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API service layer
│   │   ├── apiClient.js        # Axios configuration
│   │   ├── authService.js      # Authentication APIs
│   │   ├── userService.js      # User management APIs
│   │   ├── friendService.js    # Friend management APIs
│   │   └── websocketService.js # WebSocket connection
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Chat.jsx
│   │   ├── Login.module.css
│   │   └── Chat.module.css
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── .env                  # Environment variables
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies
```

## API Integration

The frontend uses Axios to communicate with the backend API:

- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable
- **WebSocket**: Configured via `VITE_WS_URL` environment variable
- **Authentication**: Token-based authentication with localStorage
- **Interceptors**: Automatic token injection and error handling

## Responsive Design

The UI is fully responsive and optimized for:

- 📱 Mobile devices (320px - 480px)
- 📲 Tablets (481px - 768px)
- 💻 Desktops (769px+)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- React 18
- Vite 5
- React Router DOM 6
- Axios
- WebSocket API
- CSS Modules
