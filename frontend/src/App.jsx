import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { CustomThemeProvider } from './context/ThemeContext';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import Graph from './pages/Graph/Graph';


function App() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </CustomThemeProvider>
  );
}

export default App;