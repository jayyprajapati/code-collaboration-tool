import { useState } from 'react';
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.svg';

// MUI Components
import { Button, CircularProgress } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Header() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
      setLoading(false);
    }
  };

  return (
    <nav>
      <img src={logo} width='220px' height='70px' alt="Code Collab logo" />
      {currentUser && (
        <Button
          className='logout-btn'
          color="error"
          onClick={handleLogout}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon />}
        >
          {loading ? 'Logging out...' : 'Logout'}
        </Button>
      )}
    </nav>
  );
}