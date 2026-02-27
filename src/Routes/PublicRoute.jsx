import React, { useContext } from 'react';
import { Navigate } from 'react-router';
import { AuthContext } from '../contexts/AuthContext';
import { LuLoader } from "react-icons/lu";

const PublicRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-emerald-950">
                <span className="text-emerald-400 animate-spin text-4xl">
                    <LuLoader />
                </span>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PublicRoute;
