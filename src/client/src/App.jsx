import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Import your pages here
import Login from "./pages/login";
import Signup from "./pages/signup";
import AccountSummary from "./pages/accountsummary";
import HomePage from "./pages/homepage";
import SellerDashboard from "./pages/sellerdashboard";
import WatchList from "./pages/watchlist";
import BiddingHistory from "./pages/biddinghistory";
import CurrentBids from "./pages/currentbids";

import WeeklyProfits from "./pages/manager/profits";
import CustomerTable from "./pages/manager/custinfo";
import MAuthReq from "./pages/manager/authreq";
import SearchExperts from "./pages/manager/searchexp";

import EAuthRequests from "./pages/expert/authreq";
import Profile from "./pages/expert/profile";

function App() {
    const [activeSubMenu, setActiveSubMenu] = useState(null); // Tracks which submenu is active

    // Function to handle submenu toggle
    const toggleSubMenu = (menu) => {
        setActiveSubMenu(activeSubMenu === menu ? null : menu); // Toggle menu visibility
    };

    return (
        <Router>
            <div className="navbar">
                <Link to="/" onClick={() => setActiveSubMenu(null)}>
                    Login
                </Link>
                <Link to="/signup" onClick={() => setActiveSubMenu(null)}>
                    Signup
                </Link>
                <Link
                    to="/accountsummary"
                    onClick={() => setActiveSubMenu(null)}
                >
                    Account Summary
                </Link>
                <Link to="/home-page" onClick={() => setActiveSubMenu(null)}>
                    Homepage
                </Link>
                <Link to="/seller-dash" onClick={() => setActiveSubMenu(null)}>
                    Seller Dashboard
                </Link>
                <Link to="/watchlist" onClick={() => setActiveSubMenu(null)}>
                    Watchlist
                </Link>
                <Link
                    to="/bidding-history"
                    onClick={() => setActiveSubMenu(null)}
                >
                    Bidding History
                </Link>
                <Link to="/current-bids" onClick={() => setActiveSubMenu(null)}>
                    Current Bids
                </Link>

                {/* Expert View Dropdown */}
                <button
                    className="nav-button"
                    onClick={() => toggleSubMenu("expert")}
                >
                    Expert View
                </button>

                {/* Manager View Dropdown */}
                <button
                    className="nav-button"
                    onClick={() => toggleSubMenu("manager")}
                >
                    Manager View
                </button>
            </div>

            {/* Expert View Sub Navbar */}
            {activeSubMenu === "expert" && (
                <div className="sub-navbar">
                    <Link
                        to="/expert/auth"
                        onClick={() => setActiveSubMenu(null)}
                    >
                        AuthReq
                    </Link>
                    <Link
                        to="/expert/profile"
                        onClick={() => setActiveSubMenu(null)}
                    >
                        Profile
                    </Link>
                </div>
            )}

            {/* Manager View Sub Navbar */}
            {activeSubMenu === "manager" && (
                <div className="sub-navbar">
                    <Link
                        to="/manager/profits"
                        onClick={() => setActiveSubMenu(null)}
                    >
                        Weekly Profits
                    </Link>
                    <Link
                        to="/manager/customer"
                        onClick={() => setActiveSubMenu(null)}
                    >
                        CustomerInfo
                    </Link>
                    <Link
                        to="/manager/auth"
                        onClick={() => setActiveSubMenu(null)}
                    >
                        AuthReq
                    </Link>
                    <Link
                        to="/manager/expertSearch"
                        onClick={() => setActiveSubMenu(null)}
                    >
                        SearchExperts
                    </Link>
                </div>
            )}

            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/accountsummary" element={<AccountSummary />} />
                <Route path="/home-page" element={<HomePage />} />
                <Route path="/seller-dash" element={<SellerDashboard />} />
                <Route path="/watchlist" element={<WatchList />} />
                <Route path="/bidding-history" element={<BiddingHistory />} />
                <Route path="/current-bids" element={<CurrentBids />} />

                <Route path="/manager/profits" element={<WeeklyProfits />} />
                <Route path="/manager/customer" element={<CustomerTable />} />
                <Route path="/manager/auth" element={<MAuthReq />} />
                <Route
                    path="/manager/expertSearch"
                    element={<SearchExperts />}
                />

                <Route path="/expert/auth" element={<EAuthRequests />} />
                <Route path="/expert/profile" element={<Profile />} />
            </Routes>
        </Router>
    );
}

export default App;
