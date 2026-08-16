import React, { useState, useEffect, useRef } from 'react';
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
  const [isDevFallback, setIsDevFallback] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef<boolean>(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      if (onError) onError('Google authentication returned no credentials.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
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

  useEffect(() => {
    if (!googleClientId) {
      setIsDevFallback(true);
      return;
    }

    let isMounted = true;
    let pollInterval: any = null;

    const setupGoogleGIS = () => {
      const googleObj = (window as any).google;
      if (!googleObj?.accounts?.id || !isMounted) return;

      // 1. Initialize GIS EXACTLY ONCE per client ID
      if (!isInitializedRef.current) {
        try {
          googleObj.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          isInitializedRef.current = true;
        } catch {
          // Ignore redundant init error
        }
      }

      // 2. Render Google Button into container with valid numeric pixel width
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        googleObj.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 380, // Numeric width in pixels (between 200 and 400)
          text: text.toLowerCase().includes('sign up') ? 'signup_with' : 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      }
    };

    const googleObj = (window as any).google;
    if (googleObj?.accounts?.id) {
      setupGoogleGIS();
    } else {
      pollInterval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(pollInterval);
          setupGoogleGIS();
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      try {
        (window as any).google?.accounts?.id?.cancel();
      } catch {
        // Cleanup active GIS state on unmount
      }
    };
  }, [googleClientId, text]);

  const handleDevMockAuth = async () => {
    setIsSubmitting(true);
    try {
      const devMockToken = `mock_google_token:google_user_${Date.now()}@parkease.com:sub_google_${Math.floor(
        Math.random() * 100000
      )}:Google-User`;
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
    } catch (err: any) {
      const errMsg = err?.message || 'Google sign-in failed.';
      if (onError) onError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDevFallback) {
    return (
      <button
        type="button"
        onClick={handleDevMockAuth}
        disabled={isSubmitting}
        className={`w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-[#18342A] font-semibold rounded-xl shadow-xs transition-all duration-200 disabled:opacity-60 cursor-pointer ${className}`}
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
    );
  }

  return (
    <div className={`w-full flex justify-center overflow-hidden min-h-[44px] ${className}`}>
      <div ref={containerRef} className="w-full max-w-[400px] flex justify-center min-h-[44px]" />
    </div>
  );
};
