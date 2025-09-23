import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ensureAccessToken, clearTokens } from '../utils/auth';

const API_BASE = import.meta?.env?.VITE_API_BASE || '';

const AdminPrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await ensureAccessToken();
        if (!token) {
          if (mounted) navigate('/admin-login', { replace: true });
          return;
        }
        const res = await fetch(`${API_BASE}/api/auth/is-admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          // invalid or expired token
          clearTokens();
          if (mounted) navigate('/admin-login', { replace: true });
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!data || data.isAdmin !== true) {
          // not an admin - go to normal login
          clearTokens();
          if (mounted) navigate('/login', { replace: true });
          return;
        }
        if (mounted) setOk(true);
      } catch (err) {
        if (mounted) navigate('/admin-login', { replace: true });
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  if (ok === null) return null; // or a loader
  return children;
};

AdminPrivateRoute.propTypes = { children: PropTypes.node };

export default AdminPrivateRoute;
