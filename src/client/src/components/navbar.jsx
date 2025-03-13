import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; //to create a navigation link in UI
import { Home, User, Heart, ShoppingCart, Bell } from "lucide-react"; // Import icons from lucide-react
import { useUser } from "../App"; // Calls the user
import {useCSRF } from "../App"; // Calls the user
import { useNavigate } from "react-router-dom"; //React hook to navigate between routes without user interaction

const Navbar = ({}) => { //parse in whether search will be filtering user, item and the dictionary it is filtering
    const [activeSubMenu, setActiveSubMenu] = useState(null);
    const { user } = useUser();
    const { csrfToken } = useCSRF();
    const [searchQuery, setSearchQuery] = useState("");


    const toggleSubMenu = (menu) => {
        setActiveSubMenu(activeSubMenu === menu ? null : menu);
    };
    const navigate = useNavigate();

    const handleSearch = () => {
        const queryParam = encodeURIComponent(searchQuery); // Encode the search query  to safely parse
        console.log("SEARCH", searchQuery);
        navigate("/current_listings", { state: { searchQuery } }); // Navigate to the current listings page with the search query
    };



    return (
        <nav className="bg-gray-800 text-white p-4 relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center w-full">
                    {/* Left - Home Icon */}
                    <Link to="/home-page" className="hover:text-gray-300">
                        <Home size={24} />
                    </Link>

                    {/* Center - Search Bar (flex-grow to occupy space) */}
                    {/* can search for user XOR expert */}
                    {/* <Search_component user = {user_check} item={item} handle_filter_Ids = {handle_filter_Ids} /> */}
                    <div className="flex-grow flex ml-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 rounded-md border border-gray-300 w-1/3"
                        />
                        <button
                            type="submit"
                            onClick={handleSearch}
                            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
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
                    <div className="flex items-center gap-x-4 ml-auto">
                        <Link to="/current_listings" className="hover:text-gray-300">
                            <ShoppingCart size={24} />
                        </Link>
                        {user?.level_of_access === 1 && (
                            <>
                                <Link to="/watchlist" className="hover:text-gray-300">
                                    <Heart size={24} />
                                </Link>
                                <Link to="/notifications" className="hover:text-gray-300">
                                    <Bell size={24} />
                                </Link>
                                <Link to="/accountsummary" className="hover:text-gray-300">
                                    <User size={24} />
                                </Link>
                            </>
                        )}

                        {user?.level_of_access === 2 && (
                            <>
                                <Link to="/expert/auth" className="hover:text-gray-300">
                                    Authentication Requests
                                </Link>
                                <Link to="/accountsummary" className="hover:text-gray-300">
                                    <User size={24} />
                                </Link>
                            </>
                        )}

                        {user?.level_of_access === 3 && (
                            <>
                                <Link to="/manager/profits" className="hover:text-gray-300">
                                    Profits
                                </Link>
                                <Link to="/manager/auth" className="hover:text-gray-300">
                                    Authentication Requests
                                </Link>
                                <Link to="/manager/customer" className="hover:text-gray-300">
                                    Customers
                                </Link>
                                <Link to="/manager/expertSearch" className="hover:text-gray-300">
                                    Expert Search
                                </Link>
                                <Link to="/accountsummary" className="hover:text-gray-300">
                                    <User size={24} />
                                </Link>
                            </>
                        )}

                        {!user && (
                            <>
                                <Link to="/" className="hover:text-gray-300">
                                    Login
                                </Link>
                                <Link to="/signup" className="hover:text-gray-300">
                                    Sign in
                                </Link>
                            </>
                        )}

                        {user && (
                            <Link to="/logout" className="hover:text-gray-300">
                                Logout
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
