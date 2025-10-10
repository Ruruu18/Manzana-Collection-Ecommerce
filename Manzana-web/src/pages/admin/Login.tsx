import { FormEvent, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const { user, isAdminOrStaff, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle redirect when authentication completes successfully
  useEffect(() => {
    if (user && isAdminOrStaff && !authLoading) {
      console.log("✅ Profile loaded successfully, redirecting to admin dashboard...");
      setLoading(false);
      navigate("/admin");
    }
  }, [user, isAdminOrStaff, authLoading, navigate]);

  // Only redirect if user is logged in and profile has loaded
  if (user && isAdminOrStaff && !authLoading) return <Navigate to="/admin" replace />;

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
      {/* Background Pattern */}
      <div className="background-pattern"></div>

      {/* Login Card */}
      <div className="login-card">
        {/* Logo Section */}
        <div className="logo-section">
          <img
            src="/images/MANZANA-LOGO.png"
            alt="Manzana Collection"
            className="brand-logo"
          />
        </div>

        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="welcome-title">Admin Dashboard</h1>
          <p className="welcome-subtitle">Sign in to manage your e-commerce platform</p>
        </div>

        {/* Login Form */}
        <form onSubmit={onSubmit} className="login-form">
          {error && (
            <div className="error-alert">
              <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@manzana.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <div className="form-footer">
            <label className="remember-me">
              <input type="checkbox" className="checkbox-input" />
              <span className="checkbox-label">Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="button-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2024 Manzana Collection. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }

        html, body {
          height: 100%;
          overflow: hidden;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .background-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 1;
          background-image:
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%);
          animation: backgroundShift 20s ease-in-out infinite;
        }

        @keyframes backgroundShift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -20px) scale(1.05); }
        }

        .login-card {
          position: relative;
          width: 100%;
          max-width: 480px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.8);
          padding: 3rem;
          animation: slideUp 0.6s ease-out;
          z-index: 10;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .brand-logo {
          max-width: 280px;
          height: auto;
          margin: 0 auto;
          display: block;
        }

        .welcome-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .welcome-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .welcome-subtitle {
          font-size: 0.95rem;
          color: #718096;
          font-weight: 400;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          color: #c33;
          font-size: 0.9rem;
        }

        .error-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 1.125rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          color: #2d3748;
          background: white;
          transition: all 0.2s ease;
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .form-input:disabled {
          background: #f7fafc;
          cursor: not-allowed;
        }

        .form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .remember-me {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-input {
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
          cursor: pointer;
          accent-color: #4299e1;
        }

        .checkbox-label {
          font-size: 0.875rem;
          color: #4a5568;
        }

        .forgot-password {
          font-size: 0.875rem;
          color: #4299e1;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .forgot-password:hover {
          color: #2b6cb0;
        }

        .submit-button {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(66, 153, 225, 0.4);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
          box-shadow: none;
        }

        .button-arrow {
          width: 20px;
          height: 20px;
          transition: transform 0.2s ease;
        }

        .submit-button:hover:not(:disabled) .button-arrow {
          transform: translateX(4px);
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .login-footer p {
          font-size: 0.875rem;
          color: #a0aec0;
        }

        @media (max-width: 768px) {
          .login-page {
            padding: 1rem;
          }

          .login-card {
            padding: 2rem;
          }

          .brand-logo {
            max-width: 220px;
          }

          .welcome-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 1.5rem;
          }

          .brand-logo {
            max-width: 180px;
          }

          .welcome-title {
            font-size: 1.25rem;
          }

          .welcome-subtitle {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}

