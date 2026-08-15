import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (errMessage: string) => void;
  text?: string;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'Continue with Google',
  className = '',
}) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      if (onError) onError('Google authentication returned no credentials.');
      setIsSubmitting(false);
      return;
    }

    try {
      const gUser = await loginWithGoogle(response.credential);
      if (onSuccess) {
        onSuccess();
      } else if (gUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (gUser.role === 'PARKING_OWNER') {
        navigate('/owner/dashboard', { replace: true });
      } else if (gUser.role === 'PARKING_STAFF' || gUser.role === 'STAFF') {
        navigate('/staff/gate-scan', { replace: true });
      } else {
        navigate('/find-parking', { replace: true });
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Google sign-in failed. Please try again.';
      if (onError) onError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      const googleObj = (window as any).google;

      if (googleClientId && googleObj?.accounts?.id) {
        googleObj.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        // Trigger Google Account Chooser overlay / prompt
        googleObj.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
            const btnElem = document.getElementById('google-btn-hidden');
            if (btnElem) {
              googleObj.accounts.id.renderButton(
                btnElem,
                { theme: 'outline', size: 'large' }
              );
            }
          }
        });
      } else {
        // Development mode fallback token when VITE_GOOGLE_CLIENT_ID is omitted
        const devMockToken = `mock_google_token:google_user_${Date.now()}@parkease.com:sub_google_${Math.floor(Math.random() * 100000)}:Google-User`;
        const gUser = await loginWithGoogle(devMockToken);
        if (onSuccess) {
          onSuccess();
        } else if (gUser.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else if (gUser.role === 'PARKING_OWNER') {
          navigate('/owner/dashboard', { replace: true });
        } else if (gUser.role === 'PARKING_STAFF' || gUser.role === 'STAFF') {
          navigate('/staff/gate-scan', { replace: true });
        } else {
          navigate('/find-parking', { replace: true });
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Google sign-in failed.';
      if (onError) onError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div id="google-btn-hidden" style={{ display: 'none' }}></div>
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={isSubmitting}
        className={`w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl shadow-xs transition-all duration-200 disabled:opacity-60 cursor-pointer ${className}`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>{isSubmitting ? 'Authenticating...' : text}</span>
      </button>
    </div>
  );
};
