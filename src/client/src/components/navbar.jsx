import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, User, Heart, ShoppingCart, Bell, History, Menu, X } from "lucide-react";
import { useUser } from "../App";

const Navbar = ({}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { user } = useUser();
    const navigate = useNavigate();
    const location = useLocation(); // Track page changes
    const [searchQuery, setSearchQuery] = useState("");

    // Auto-collapse menu when route changes
    useEffect(() => {
        setMenuOpen(false); // Automatically close the mobile menu on page change
    }, [location.pathname]);

    const handleSearch = useCallback(() => {
        const queryParam = encodeURIComponent(searchQuery); // Encode the search query  to safely parse
        // console.log("SEARCH", searchQuery);
        navigate("/current_listings", { state: { searchQuery } });
        // if (searchQuery)
        // {
        // const queryParam = encodeURIComponent(searchQuery); // Encode the search query  to safely parse
        // // console.log("SEARCH", searchQuery);
        // navigate("/current_listings", { state: { searchQuery } });
        // } else {
        //     alert("No search query entered. To view all listings navigate to homepage");
        //     //should i automatically navigate to homepage?
        // }
    }, [searchQuery, navigate]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    // Define menu items for each access level
    const menuItems = {
        1: [
            { to: "/watchlist", label: <Heart size={24} /> },
            { to: "/accountsummary", label: <User size={24} /> },
            { to: "/current-bids", label: <ShoppingCart size={24} /> },
            { to: "/bidding-history", label: <History size={24} /> },
        ],
        2: [
            { to: "/expert/auth", label: "Authentication Requests" },
            { to: "/accountsummary", label: <User size={24} /> },
        ],
        3: [
            { to: "/manager/profits", label: "Profits" },
            { to: "/manager/auth", label: "Authentication Requests" },
            { to: "/manager/customer", label: "Customers" },
            { to: "/manager/expertSearch", label: "Expert Search" },
            { to: "/accountsummary", label: <User size={24} /> },
        ],
    };

    // Get the links based on user access level
    const links = menuItems[user?.level_of_access] || [];

    return (
        <nav className="bg-gray-800 text-white p-4">
            <div className="flex items-center justify-between">
                {/* Left - Home Icon */}
                <Link to="/home-page" className="hover:text-gray-300">
                    <Home size={24} />
                </Link>

                {/* Mobile menu toggle */}
                <button
                    className="sm:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Center - Search Bar (flex-grow to occupy space) */}
                <div className="hidden sm:flex flex-grow items-center ml-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="p-2 rounded-md border border-gray-300 w-full sm:w-1/3 focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 ml-2"
                    >
                        Search
                    </button>
                </div>
                {user?.level_of_access === 1 && (
                    <>
                        {/* Temporarily here, to be moved to account summary page */}
                        <Link to="/create-listing" className="hover:text-gray-300 mr-2">
                            {" "}
                            Create Listing
                        </Link>
                        <Link to="/seller-dash" className="hover:text-gray-300 mr-2">
                            {" "}
                            Seller Dashboard{" "}
                        </Link>
                    </>
                )}

                {/* Right - Icons pushed to far right */}
                <div className="hidden sm:flex items-center gap-x-4">
                    {links.map((link) => (
                        <Link to={link.to} className="hover:text-gray-300" key={link.to}>
                            {link.label}
                        </Link>
                    ))}
                    {!user ? (
                        <>
                            <Link to="/login" className="hover:text-gray-300">
                                Login
                            </Link>
                            <Link to="/signup" className="hover:text-gray-300">
                                Sign Up
                            </Link>
                        </>
                    ) : (
                        <Link to="/logout" className="hover:text-gray-300">
                            Logout
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile navigation menu*/}
            <div
                className={`sm:hidden transition-all duration-300 ease-in-out ${
                    menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}
            >
                <div className="flex flex-col items-center gap-y-3 mt-3">
                    <div className="w-full px-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="p-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="mt-2 p-2 w-full bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:ring-2 focus:ring-blue-400"
                        >
                            Search
                        </button>
                    </div>

                    {links.map((link) => (
                        <Link to={link.to} className="hover:text-gray-300" key={link.to}>
                            {link.label}
                        </Link>
                    ))}

                    {!user ? (
                        <>
                            <Link to="/" className="hover:text-gray-300">
                                Login
                            </Link>
                            <Link to="/signup" className="hover:text-gray-300">
                                Sign Up
                            </Link>
                        </>
                    ) : (
                        <Link to="/logout" className="hover:text-gray-300">
                            Logout
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
