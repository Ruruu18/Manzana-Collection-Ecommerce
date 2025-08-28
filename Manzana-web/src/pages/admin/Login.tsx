import { FormEvent, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const { user, isAdmin, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle redirect when authentication completes successfully
  useEffect(() => {
    if (user && isAdmin && !authLoading) {
      console.log("✅ Profile loaded successfully, redirecting to admin dashboard...");
      setLoading(false);
      navigate("/admin");
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Only redirect if user is logged in and profile has loaded
  if (user && isAdmin && !authLoading) return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        // Don't navigate immediately - let the auth state change handle it
        // The useEffect in AuthContext will load the profile and trigger a redirect
        console.log("Login successful, waiting for profile to load...");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Background Elements */}
      <div className="bg-animation">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-element fe-1">🛍️</div>
        <div className="floating-element fe-2">✨</div>
        <div className="floating-element fe-3">👗</div>
        <div className="floating-element fe-4">💎</div>
        <div className="floating-element fe-5">🌟</div>
      </div>

      {/* Main Container */}
      <div className="login-container">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-logo">
            <div className="logo-icon">🛍️</div>
            <div className="logo-text">
              <span className="brand-name">MANZANA</span>
              <span className="brand-tagline">Collection</span>
            </div>
          </div>
          <p className="brand-description">
            Welcome to your admin dashboard. Sign in to manage your fashion empire.
          </p>
        </div>

        {/* Login Form */}
        <div className="login-form-wrapper">
          <div className="form-header">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Please sign in to your account</p>
          </div>

          <form onSubmit={onSubmit} className="login-form">
            <div className="input-group">
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  disabled={loading}
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  disabled={loading}
                />
                <div className="input-focus-line"></div>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" className="checkbox" />
                <span className="checkmark"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-button" disabled={loading}>
              <span className="button-content">
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="button-arrow">→</span>
                  </>
                )}
              </span>
            </button>


          </form>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        html, body {
          height: 100%;
          overflow: hidden;
        }

        .login-page {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          position: relative;
          overflow: hidden;
        }

        /* Background Animation */
        .bg-animation {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(40px);
          animation: blob 7s infinite;
        }

        .blob-1 {
          top: 0;
          left: 0;
          width: 300px;
          height: 300px;
          background: linear-gradient(45deg, #ff6b6b, #feca57);
          animation-delay: 0s;
        }

        .blob-2 {
          top: 50%;
          right: 0;
          width: 400px;
          height: 400px;
          background: linear-gradient(45deg, #48cae4, #023e8a);
          animation-delay: 2s;
        }

        .blob-3 {
          bottom: 0;
          left: 50%;
          width: 350px;
          height: 350px;
          background: linear-gradient(45deg, #f093fb, #f5576c);
          animation-delay: 4s;
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        /* Floating Elements */
        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }

        .floating-element {
          position: absolute;
          font-size: 2rem;
          opacity: 0.1;
          animation: float 6s ease-in-out infinite;
        }

        .fe-1 { top: 10%; left: 10%; animation-delay: 0s; }
        .fe-2 { top: 20%; right: 15%; animation-delay: 1s; }
        .fe-3 { bottom: 30%; left: 20%; animation-delay: 2s; }
        .fe-4 { bottom: 20%; right: 25%; animation-delay: 3s; }
        .fe-5 { top: 60%; left: 80%; animation-delay: 4s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        /* Main Container */
        .login-container {
          position: relative;
          z-index: 10;
          display: flex;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          overflow: hidden;
          min-height: 600px;
          width: 900px;
          max-width: 90vw;
        }

        /* Brand Section */
        .brand-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          position: relative;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .logo-icon {
          font-size: 3rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 2px;
        }

        .brand-tagline {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 300;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        .brand-description {
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 300px;
        }

        /* Login Form Section */
        .login-form-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          position: relative;
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .form-subtitle {
          color: #666;
          font-size: 1rem;
          font-weight: 400;
        }

        .login-title {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
          margin: 0 0 3rem 0;
          letter-spacing: 1px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          font-size: 1.2rem;
          z-index: 2;
          opacity: 0.6;
          transition: all 0.3s ease;
        }

        .form-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3.5rem;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          font-size: 16px;
          font-weight: 400;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .form-input::placeholder {
          color: #999;
          font-weight: 400;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          background: white;
          box-shadow: 
            0 0 0 4px rgba(102, 126, 234, 0.1),
            0 8px 25px rgba(102, 126, 234, 0.15);
          transform: translateY(-1px);
        }

        .form-input:focus + .input-focus-line {
          transform: scaleX(1);
        }

        .form-input:focus ~ .input-icon {
          opacity: 1;
          color: #667eea;
        }

        .input-focus-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transform: scaleX(0);
          transition: transform 0.3s ease;
          border-radius: 1px;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0.5rem 0 1.5rem 0;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .checkbox {
          opacity: 0;
          position: absolute;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          border: 2px solid #ddd;
          border-radius: 4px;
          margin-right: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .checkbox:checked + .checkmark {
          background: #667eea;
          border-color: #667eea;
        }

        .checkbox:checked + .checkmark::after {
          content: '✓';
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .checkbox-label {
          font-size: 14px;
          color: #666;
          user-select: none;
        }

        .forgot-link {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .forgot-link:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #ff6b6b, #ee5a52);
          border: none;
          border-radius: 12px;
          padding: 1rem;
          color: white;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
          margin-bottom: 1rem;
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .error-icon {
          font-size: 16px;
        }

        .login-button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 4px 15px rgba(102, 126, 234, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .login-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .login-button:hover::before {
          left: 100%;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 25px rgba(102, 126, 234, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          background: linear-gradient(135deg, #cccccc, #aaaaaa);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          z-index: 1;
        }

        .button-arrow {
          transition: transform 0.3s ease;
        }

        .login-button:hover .button-arrow {
          transform: translateX(4px);
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }



        .forgot-password {
          color: #667eea;
          font-size: 14px;
          text-decoration: none;
          text-align: center;
          display: block;
          margin-top: 1.5rem;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .forgot-password:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        .login-right {
          flex: 1;
          width: 50vw;
          height: 100vh;
          background: linear-gradient(135deg, #F48FB1 0%, #E91E63 50%, #AD1457 100%);
          position: relative;
          overflow: hidden;
        }

        .backdrop-container {
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .backdrop-container::before {
          content: '🛍️';
          font-size: 120px;
          opacity: 0.3;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }

        @media (max-width: 768px) {
          html, body {
            overflow: auto;
          }

          .login-page {
            flex-direction: column;
            height: auto;
            min-height: 100vh;
          }

          .login-left {
            padding: 1.5rem;
            min-height: auto;
          }

          .login-right {
            min-height: 50vh;
            width: 100vw;
            height: 50vh;
          }

          .login-title {
            font-size: 24px;
            margin-bottom: 2rem;
            text-align: center;
          }

          .login-form-container {
            max-width: 350px;
          }
        }

        @media (max-width: 480px) {
          .login-left {
            padding: 1rem;
          }

          .login-title {
            font-size: 20px;
          }

          .input {
            padding: 0.875rem;
            font-size: 14px;
          }

          .login-button {
            padding: 0.875rem;
            font-size: 14px;
          }

          .login-right {
            min-height: 40vh;
            height: 40vh;
          }
        }
      `}</style>
    </div>
  );
}

