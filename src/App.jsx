import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Rooms from './pages/Rooms';
import Conversations from './pages/Conversations';
import Friends from './pages/Friends';
import { authService } from './api/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Signup setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated ? (
              <Chat setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/rooms"
          element={
            isAuthenticated ? <Rooms /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/conversations"
          element={
            isAuthenticated ? (
              <Conversations />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/friends"
          element={
            isAuthenticated ? <Friends /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? '/chat' : '/login'} replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
