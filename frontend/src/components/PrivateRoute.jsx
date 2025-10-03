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
        // Access token süresi dolmuş olsa bile burada yenilenir
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

// eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyOCIsImlzcyI6ImFsZ28tbmV0IiwiaWF0IjoxNzU5MTg4NjY4LCJleHAiOjE3NTkxOTA0NjgsImVtYWlsIjoiY2VtYWxib2xhdDIwMDNAb3V0bG9vay5jb20iLCJ0eXAiOiJhY2Nlc3MifQ.G7aBcTN_02nUPPoGdeGR_TGFJhERVsj_xX6BXJHqixJySXUA2F0TIbCWOglgwemye7hfehIU6br9ODCa4xVIFw
// 