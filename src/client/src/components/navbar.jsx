import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom"; //to create a navigation link in UI
import { Home, User, Heart, ShoppingCart, Bell } from "lucide-react"; // Import icons from lucide-react

import { useUser } from "../App"; // Calls the user

import { useNavigate } from 'react-router-dom'; //React hook to navigate between routes without user interaction



// import React, { useState } from "react";
// import { Link } from "react-router-dom";

const Navbar = ({ searchQuery, setSearchQuery }) => {

    const [activeSubMenu, setActiveSubMenu] = useState(null);

    const toggleSubMenu = (menu) => {
        setActiveSubMenu(activeSubMenu === menu ? null : menu);
    };
    const navigate = useNavigate();

    const handleSearch = () => {
        // alert("Search button clicked!");
        const queryParam = encodeURIComponent(searchQuery); // Encode the search query  to safely parse
        navigate("/current_listings", { state: {searchQuery} }); // Navigate to the current listings page with the search query
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
                <div className="flex-grow flex ml-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}      
                        className="p-2 rounded-md border border-gray-300 w-1/3" 
                    />
                    <button 
                        type="submit" onClick = {handleSearch} class="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                        Search
                    </button>
                </div>
                {/* Dont know where to add these */}
                <Link to="/create-listing" className="hover:text-gray-300 mr-2"> Create Listing 
                </Link>
                <Link to = "/seller-dash" className="hover:text-gray-300 mr-2"> Seller Dashboard </Link>
                {/* Right - Icons pushed to far right */}
                <div className="flex items-center gap-x-4 ml-auto">
                    <Link to="/current_listings" className="hover:text-gray-300">
                        <ShoppingCart size={24} />
                    </Link>
                    <Link to="/watchlist" className="hover:text-gray-300">
                        <Heart size={24} />
                    </Link>
                    <Link to="/notifications" className="hover:text-gray-300">
                        <Bell size={24} />
                    </Link>
                    <Link to="/accountsummary" className="hover:text-gray-300">
                        <User size={24} />
                    </Link>
                    <Link to="/" className="hover:text-gray-300"> Login
                    </Link>
                    <Link to="/signup" className="hover:text-gray-300"> Sign in
                    </Link>
                </div>
            </div>

                {/* <div className="space-x-4 relative">
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
                </div> */}
            </div>

            {/* {activeSubMenu === "expert" && (
                <div className="absolute top-full left-0 w-full bg-gray-800 p-2 mt-1 rounded shadow-md z-50">
                    <Link to="/expert/auth" className="block p-2 hover:bg-gray-700">AuthReq</Link>
                    <Link to="/expert/profile" className="block p-2 hover:bg-gray-700">Profile</Link>
                </div>
            )} */}

            {/* {activeSubMenu === "manager" && (
                <div className="absolute top-full left-0 w-full bg-gray-800 p-2 mt-1 rounded shadow-md z-50">
                    <Link to="/manager/profits" className="block p-2 hover:bg-gray-700">Weekly Profits</Link>
                    <Link to="/manager/customer" className="block p-2 hover:bg-gray-700">Customer Info</Link>
                    <Link to="/manager/auth" className="block p-2 hover:bg-gray-700">AuthReq</Link>
                    <Link to="/manager/expertSearch" className="block p-2 hover:bg-gray-700">Search Experts</Link>
                </div>
            )} */}

            
        </nav>
    );
};

export default Navbar;