import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, User, Heart, ShoppingCart, Bell, History, Menu, X, Search } from "lucide-react";
import { useUser } from "../App";

const Navbar = ({}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { user } = useUser();
    const navigate = useNavigate();
    const location = useLocation(); // Track page changes
    const [searchQuery, setSearchQuery] = useState("");

    // Auto-collapse menu when route changes
    useEffect(() => {
        setMenuOpen(false); // Automatically close the mobile menu on page change
        setSearchOpen(false); // Close search dropdown on page change
    }, [location.pathname]);

    const handleSearch = useCallback(() => {
        const queryParam = encodeURIComponent(searchQuery); // Encode the search query to safely parse
        navigate("/current_listings", { state: { searchQuery } });
    }, [searchQuery, navigate]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSearch();
    };

    // Define menu items for each access level
    const menuItems = {
        1: [
            { to: "/watchlist", icon: <Heart size={28} />, label: "Watchlist" },
            { to: "/accountsummary", icon: <User size={28} />, label: "Account Summary" },
            { to: "/current-bids", icon: <ShoppingCart size={28} />, label: "Current Bids" },
            { to: "/bidding-history", icon: <History size={28} />, label: "Bidding History" },
        ],
        2: [
            { to: "/expert/auth", icon: null, label: "Authentication Requests" },
            { to: "/accountsummary", icon: <User size={28} />, label: "Account Summary" },
        ],
        3: [
            { to: "/manager/profits", icon: null, label: "Profits" },
            { to: "/manager/auth", icon: null, label: "Authentication Requests" },
            { to: "/manager/customer", icon: null, label: "Customers" },
            { to: "/manager/expertSearch", icon: null, label: "Expert Search" },
            { to: "/accountsummary", icon: <User size={28} />, label: "Account Summary" },
        ],
    };

    // Get the links based on user access level
    const links = menuItems[user?.level_of_access] || [];

    return (
        <nav className="bg-gray-800 text-white p-4" role="navigation" aria-label="Main Navigation">
            <div className="flex items-center justify-between">
                {/* Mobile menu toggle */}
                <button
                    className="md:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu"
                >
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Website Name for desktop */}
                <Link
                    to="/home-page"
                    className="hidden md:block text-lg font-bold text-gray-200 hover:text-white hover:scale-105 transition-all duration-300 ease-in-out"
                    aria-label="Bidly Home"
                >
                    Bidly
                </Link>

                {/* Website name for mobile */}
                <Link
                    to="/home-page"
                    className="md:hidden text-lg font-bold"
                    aria-label="Bidly Home"
                >
                    Bidly
                </Link>

                {/* Search Bar for desktop */}
                <div className="hidden md:flex items-center justify-center flex-grow mx-10">
                    <div className="w-2/3">
                        <label htmlFor="desktop-search" className="sr-only">
                            Search
                        </label>
                        <input
                            id="desktop-search"
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="p-2 rounded-md border border-gray-300 w-full focus:ring-2 focus:ring-blue-400 text-sm"
                            aria-label="Search"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 ml-2 transition-colors duration-300 ease-in-out text-sm"
                        aria-label="Submit search"
                    >
                        Search
                    </button>
                </div>

                {/* Icons for desktop */}
                <div className="hidden md:flex items-center gap-x-6">
                    {links.map((link) => (
                        <Link
                            to={link.to}
                            className="text-gray-300 hover:text-white hover:scale-110 transition-all duration-300 ease-in-out"
                            key={link.to}
                            title={link.label}
                            aria-label={link.label}
                        >
                            {link.icon || <span className="text-sm">{link.label}</span>}
                        </Link>
                    ))}
                    {!user ? (
                        <>
                            <Link
                                to="/login"
                                className="text-sm text-gray-300 hover:text-white hover:scale-105 transition-all duration-300 ease-in-out"
                                aria-label="Log in to your account"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="text-sm text-gray-300 hover:text-white hover:scale-105 transition-all duration-300 ease-in-out"
                                aria-label="Sign up for a new account"
                            >
                                Sign Up
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/logout"
                            className="text-sm text-gray-300 hover:text-white hover:scale-105 transition-all duration-300 ease-in-out"
                            aria-label="Log out of your account"
                        >
                            Logout
                        </Link>
                    )}
                </div>

                {/* Search toggle for mobile */}
                <button
                    className="md:hidden"
                    onClick={() => setSearchOpen(!searchOpen)}
                    aria-label="Toggle search"
                    aria-expanded={searchOpen}
                    aria-controls="mobile-search"
                >
                    <Search size={28} />
                </button>
            </div>

            {/* Mobile search dropdown */}
            <div
                id="mobile-search"
                className={`md:hidden transition-all duration-300 ease-in-out ${
                    searchOpen ? "max-h-20 opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"
                }`}
                aria-hidden={!searchOpen}
            >
                <div className="px-4 pt-2 pb-2">
                    <div className="flex items-center gap-2">
                        <label htmlFor="mobile-search-input" className="sr-only">
                            Search
                        </label>
                        <input
                            id="mobile-search-input"
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="p-2 flex-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-400 text-sm"
                            aria-label="Search"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors duration-300 ease-in-out text-sm whitespace-nowrap"
                            aria-label="Submit search"
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile navigation menu */}
            <div
                id="mobile-menu"
                className={`md:hidden transition-all duration-300 ease-in-out ${
                    menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                }`}
                aria-hidden={!menuOpen}
            >
                <div className="flex flex-col items-start gap-y-4 mt-4 pl-4" role="menu">
                    {links.map((link) => (
                        <Link
                            to={link.to}
                            className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 ease-in-out"
                            key={link.to}
                            role="menuitem"
                            aria-label={link.label}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {!user ? (
                        <>
                            <Link
                                to="/login"
                                className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 ease-in-out"
                                role="menuitem"
                                aria-label="Log in to your account"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 ease-in-out"
                                role="menuitem"
                                aria-label="Sign up for a new account"
                            >
                                Sign Up
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/logout"
                            className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-300 ease-in-out"
                            role="menuitem"
                            aria-label="Log out of your account"
                        >
                            Logout
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
