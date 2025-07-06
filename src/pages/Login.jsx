import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, CircularProgress } from "@mui/material";

export default function Login() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // The useEffect will handle the redirect
    } catch (err) {
      console.error("Google login error:", err);
      setLoading(false);
    }
    // No need to set loading to false here, as the component will unmount on successful login and redirect.
  };

  return (
    <div className="login-container">
      <h1>Code Collaboration Tool</h1>
      <div className="auth-buttons">
        <Button
          variant="contained"
          className="google-auth"
          onClick={handleGoogleLogin}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Logging in...' : 'Login with Google'}
        </Button>
      </div>
    </div>
  );
}