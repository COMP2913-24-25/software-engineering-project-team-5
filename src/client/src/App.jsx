import React, { useState, createContext, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Import your pages here
import Login from "./pages/login";
import Signup from "./pages/signup";
import HomePage from "./pages/homepage";
import SellerDashboard from "./pages/sellerdashboard";
import WatchList from "./pages/watchlist";
import BiddingHistory from "./pages/biddinghistory";
import CurrentBids from "./pages/currentbids";
import CreateListing from "./pages/create_listing"

import WeeklyProfits from "./pages/manager/profits";
import CustomerTable from "./pages/manager/custinfo";
import MAuthReq from "./pages/manager/authreq";
import SearchExperts from "./pages/manager/searchexp";

import EAuthRequests from "./pages/expert/authreq";
import Profile from "./pages/expert/profile";


// Creates a global state to store user information - Makes it available to ANY component in the app
export const UserContext = createContext();

// Makes it so components can be accessed without needing the Provider directly.
export const useUser = () => useContext(UserContext);


// ORDER MATTERS. DO NOT MOVE THIS BELOW THE function App(){...}
// DO NOT MOVE THIS CODE PLEASE OR ALTER IT PLEASE
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // This is the initial state when no one is logged in, so it is null

    useEffect(() => {
        // Check if the user is already logged in
        // With credentials having include, even if the papge is refreshed, the app will remember that the user is logged in.
        fetch("http://localhost:5000/api/user", {credentials: "include"})
            .then(response => response.json())
            .then(data => {
                if (data.user_id) setUser(data);
            })
            .catch(error => console.error("Failed to fetch user", error));
    }, []);

    return (
        // Provides the data to the components
        <UserContext.Provider value={{user, setUser}}>
            {children}
        </UserContext.Provider>
    );
};

function App() {
    const [activeSubMenu, setActiveSubMenu] = useState(null); // Tracks which submenu is active

    // Function to handle submenu toggle
    const toggleSubMenu = (menu) => {
        setActiveSubMenu(activeSubMenu === menu ? null : menu); // Toggle menu visibility
    };

    return (
        //Wraps the app in UserProvider 
        <UserProvider>
            <Router>
                <div className="navbar">
                    <Link to="/" onClick={() => setActiveSubMenu(null)}>Login</Link>
                    <Link to="/signup" onClick={() => setActiveSubMenu(null)}>Signup</Link>
                    <Link to="/home-page" onClick={() => setActiveSubMenu(null)}>Homepage</Link>
                    <Link to="/seller-dash" onClick={() => setActiveSubMenu(null)}>Seller Dashboard</Link>
                    <Link to="/watchlist" onClick={() => setActiveSubMenu(null)}>Watchlist</Link>
                    <Link to="/bidding-history" onClick={() => setActiveSubMenu(null)}>Bidding History</Link>
                    <Link to="/current-bids" onClick={() => setActiveSubMenu(null)}>Current Bids</Link>

                    {/* Expert View Dropdown */}
                    <button className="nav-button" onClick={() => toggleSubMenu("expert")}>Expert View</button>

                    {/* Manager View Dropdown */}
                    <button className="nav-button" onClick={() => toggleSubMenu("manager")}>Manager View</button>
                </div>

                {/* Expert View Sub Navbar */}
                {activeSubMenu === "expert" && (
                    <div className="sub-navbar">
                        <Link to="/expert/auth" onClick={() => setActiveSubMenu(null)}>AuthReq</Link>
                        <Link to="/expert/profile" onClick={() => setActiveSubMenu(null)}>Profile</Link>
                    </div>
                )}

                {/* Manager View Sub Navbar */}
                {activeSubMenu === "manager" && (
                    <div className="sub-navbar">
                        <Link to="/manager/profits" onClick={() => setActiveSubMenu(null)}>Weekly Profits</Link>
                        <Link to="/manager/customer" onClick={() => setActiveSubMenu(null)}>CustomerInfo</Link>
                        <Link to="/manager/auth" onClick={() => setActiveSubMenu(null)}>AuthReq</Link>
                        <Link to="/manager/expertSearch" onClick={() => setActiveSubMenu(null)}>SearchExperts</Link>
                    </div>
                )}

                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/home-page" element={<HomePage />} />
                    <Route path="/seller-dash" element={<SellerDashboard />} />
                    <Route path="/watchlist" element={<WatchList />} />
                    <Route path="/bidding-history" element={<BiddingHistory />} />
                    <Route path="/current-bids" element={<CurrentBids />} />
                    <Route path="/create-listing" element={<CreateListing />} />

                    <Route path="/manager/profits" element={<WeeklyProfits />} />
                    <Route path="/manager/customer" element={<CustomerTable />} />
                    <Route path="/manager/auth" element={<MAuthReq />} />
                    <Route path="/manager/expertSearch" element={<SearchExperts />} />

                    <Route path="/expert/auth" element={<EAuthRequests />} />
                    <Route path="/expert/profile" element={<Profile />}/>


                </Routes>
            </Router>
        </UserProvider>
    );
}

export default App;
