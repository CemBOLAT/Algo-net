import React from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { CustomThemeProvider } from './context/ThemeContext';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ForgotPassword/ResetPassword';
import Graph from './pages/Graph/Graph';
import PrivateRoute from './components/PrivateRoute';
import GraphCreation from './pages/GraphCreation/GraphCreation';
import ArrayAlgorithms from './pages/ArrayAlgorithms/ArrayAlgorithms';
import TreeAlgorithms from './pages/TreeAlgorithms/TreeAlgorithms';
import Admin from './pages/Admin/Admin';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminPrivateRoute from './components/AdminPrivateRoute';


function App() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/graph" element={<PrivateRoute><Graph /></PrivateRoute>} />
          <Route path="/graph-creation" element={<PrivateRoute><GraphCreation /></PrivateRoute>} />
          <Route path="/array-algorithms" element={<PrivateRoute><ArrayAlgorithms /></PrivateRoute>} />
          <Route path="/tree-algorithms" element={<PrivateRoute><TreeAlgorithms /></PrivateRoute>} />
          <Route path="/admin" element={<AdminPrivateRoute><Admin /></AdminPrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </CustomThemeProvider>
  );
}

export default App;