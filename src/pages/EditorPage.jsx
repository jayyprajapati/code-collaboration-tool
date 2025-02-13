export default function EditorPage() {
    return (
      <div className="login-container">
        <h1>Code Collaboration Tool</h1>
        <div className="auth-buttons">
          <button className="github-auth">
            Login with GitHub
          </button>
          <button className="google-auth">
            Login with Google
          </button>
        </div>
      </div>
    );
  }