import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
    const [activeSubMenu, setActiveSubMenu] = useState(null);

    const toggleSubMenu = (menu) => {
        setActiveSubMenu(activeSubMenu === menu ? null : menu);
    };

    return (
        <nav className="bg-gray-800 text-white p-4 relative">
            <div className="flex items-center justify-between">
                <div className="space-x-4">
                    <Link to="/" className="hover:text-gray-300">Login</Link>
                    <Link to="/signup" className="hover:text-gray-300">Signup</Link>
                    <Link to="/accountsummary" className="hover:text-gray-300">Account Summary</Link>
                    <Link to="/home-page" className="hover:text-gray-300">Homepage</Link>
                    <Link to="/seller-dash" className="hover:text-gray-300">Seller Dashboard</Link>
                    <Link to="/watchlist" className="hover:text-gray-300">Watchlist</Link>
                    <Link to="/bidding-history" className="hover:text-gray-300">Bidding History</Link>
                    <Link to="/current-bids" className="hover:text-gray-300">Current Bids</Link>
                </div>

                <div className="space-x-4 relative">
                    <button
                        className="bg-gray-700 px-3 py-2 rounded-md hover:bg-gray-600"
                        onClick={() => toggleSubMenu("expert")}
                    >
                        Expert View
                    </button>

                    <button
                        className="bg-gray-700 px-3 py-2 rounded-md hover:bg-gray-600"
                        onClick={() => toggleSubMenu("manager")}
                    >
                        Manager View
                    </button>
                </div>
            </div>

            {activeSubMenu === "expert" && (
                <div className="absolute top-full left-0 w-full bg-gray-800 p-2 mt-1 rounded shadow-md z-50">
                    <Link to="/expert/auth" className="block p-2 hover:bg-gray-700">AuthReq</Link>
                    <Link to="/expert/profile" className="block p-2 hover:bg-gray-700">Profile</Link>
                </div>
            )}

            {activeSubMenu === "manager" && (
                <div className="absolute top-full left-0 w-full bg-gray-800 p-2 mt-1 rounded shadow-md z-50">
                    <Link to="/manager/profits" className="block p-2 hover:bg-gray-700">Weekly Profits</Link>
                    <Link to="/manager/customer" className="block p-2 hover:bg-gray-700">Customer Info</Link>
                    <Link to="/manager/auth" className="block p-2 hover:bg-gray-700">AuthReq</Link>
                    <Link to="/manager/expertSearch" className="block p-2 hover:bg-gray-700">Search Experts</Link>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
