import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { http, clearTokens } from '../utils/auth';

const AdminPrivateRoute = ({ children }) => {
  const navigate = useNavigate();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await http.get('/api/auth/is-admin', { auth: true });
        if (mounted) setOk(true);
      } catch {
        clearTokens();
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
        