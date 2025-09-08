import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ensureAccessToken, getTokens, isTokenExpired, clearTokens } from '../utils/auth';

export default function PrivateRoute({ children }) {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      try {
        const { refreshToken } = getTokens();
        if (!refreshToken || isTokenExpired(refreshToken, 0)) {
          clearTokens();
          setAllowed(false);
          return;
        }
        await ensureAccessToken();
        setAllowed(true);
      } catch {
        clearTokens();
        setAllowed(false);
      } finally {
        setChecked(true);
      }
    };
    run();
  }, []);

  if (!checked) return null; // could render a loader
  if (!allowed) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
