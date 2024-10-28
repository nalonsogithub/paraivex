// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { auth } = useAuth(); // Access auth from context

    return auth ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
