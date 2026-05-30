import React, { useContext } from 'react';
import { Navigate } from 'react-router';
import { AuthContext } from '../contexts/AuthContext';
import CircularLoader from '../components/sheard/CircularLoader';

const PublicRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <CircularLoader />;
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PublicRoute;
