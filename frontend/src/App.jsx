import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { CustomThemeProvider } from './context/ThemeContext';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ForgotPassword/ResetPassword';
import Graph from './pages/Graph/Graph';
import PrivateRoute from './components/PrivateRoute';


function App() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/graph" element={<PrivateRoute><Graph /></PrivateRoute>} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </CustomThemeProvider>
  );
}

export default App;