import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AuthContextType, UserProfile } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Global type for Google Identity Services
declare global {
  interface Window {
    google: any;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Safe retrieval of Client ID inside component
  const googleClientId = useMemo(() => {
    try {
      if (typeof process !== "undefined" && process.env && process.env.GOOGLE_CLIENT_ID) {
        return process.env.GOOGLE_CLIENT_ID;
      }
    } catch (e) {
      console.warn("Could not read process.env for Client ID");
    }
    return "632705540059-6ob762i3tdt94r2t841lm29ajd66pk30.apps.googleusercontent.com"; // Fallback
  }, []);

  // Initialize Token Client
  useEffect(() => {
    // Basic check to ensure script is loaded and ID is set
    if (window.google && googleClientId && googleClientId !== "YOUR_CLIENT_ID_HERE") {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (response: any) => {
            if (response.access_token) {
              setIsLoading(true);
              // Fetch user profile using the access token
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` },
                });
                const userInfo = await userInfoRes.json();
                setUser({
                  name: userInfo.name,
                  email: userInfo.email,
                  avatarUrl: userInfo.picture,
                });
              } catch (error) {
                console.error("Failed to fetch user info", error);
                alert("Failed to fetch user profile. See console for details.");
              } finally {
                setIsLoading(false);
              }
            }
          },
        });
        setTokenClient(client);
      } catch (e) {
        console.error("Error initializing Google Token Client:", e);
      }
    }
  }, [googleClientId]);

  const login = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      if (googleClientId === "YOUR_CLIENT_ID_HERE") {
        alert("Authentication Setup Required:\n\nPlease configure GOOGLE_CLIENT_ID in your environment variables.");
      } else {
        alert("Google Identity Services are not ready yet. Please refresh the page.");
      }
    }
  };

  const logout = () => {
    setUser(null);
    if (window.google) {
      window.google.accounts.oauth2.revoke(user?.email, () => {
        console.log('Consent revoked');
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};