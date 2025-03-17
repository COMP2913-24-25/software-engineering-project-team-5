import React from "react";
import { Link } from "react-router-dom";
import { Home, Lock, LogIn } from "lucide-react";

const UnauthorizedAccess = () => {
    return (
        <div className="relative min-h-screen bg-gray-100 flex flex-col items-center px-[5%] md:px-[10%] py-[10%]">
            <div className="mb-8 text-blue-500">
                <Lock size={96} strokeWidth={1.5} />
            </div>

            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-6xl font-bold text-gray-800 mb-4">401</h1>
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">
                    Access Denied
                </h2>
                <p className="text-lg text-gray-500 mt-2 max-w-lg mx-auto">
                    You don't have permission to access this page. Please log in with the
                    appropriate credentials.
                </p>
            </div>

            <div className="flex flex-row gap-4">
                <Link
                    to="/"
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors"
                >
                    <Home size={20} className="mr-2" />
                    Back to Home Page
                </Link>

                <Link
                    to="/"
                    className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg transition-colors"
                >
                    <LogIn size={20} className="mr-2" />
                    Log In
                </Link>
            </div>
        </div>
    );
};

export default UnauthorizedAccess;
