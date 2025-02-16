import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../firebase";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
    const handleGoogleLogin = async () => {
        try {
          await signInWithPopup(auth, googleProvider);
          // We'll handle redirect to dashboard in next steps
        } catch (err) {
          console.error(err);
        }
    }
    
    const handleGithubLogin = async () => {
        try {
          await signInWithPopup(auth, githubProvider);
        } catch (err) {
          console.error(err);
        }
      };

    return (
      <div className="login-container">
        <h1>Code Collaboration Tool</h1>
        <div className="auth-buttons">
          <button className="github-auth" onClick={handleGithubLogin}>
            Login with GitHub
          </button>
          <button className="google-auth" onClick={handleGoogleLogin}>
            Login with Google
          </button>
        </div>
      </div>
    );
  }