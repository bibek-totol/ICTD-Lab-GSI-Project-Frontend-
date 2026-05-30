import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router";
import { AuthContext } from "../contexts/AuthContext";
import { HiOutlineShieldExclamation } from "react-icons/hi";
import CircularLoader from "../components/sheard/CircularLoader";

const SuperAdminRoute = ({ children }) => {
    const { user, loading, isSuperAdmin } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return <CircularLoader />;
    }

    // Not logged in at all → redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Logged in but not SuperAdmin → show access denied
    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HiOutlineShieldExclamation className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-emerald-950 mb-3">Access Denied</h1>
                    <p className="text-emerald-600 mb-6">
                        This section is only accessible to <strong>Super Admin</strong> accounts.
                        Your current role is <strong className="text-red-600">{user?.role}</strong>.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default SuperAdminRoute;
