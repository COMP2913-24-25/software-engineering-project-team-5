import React, { useState, createContext, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { NotificationProvider } from "./components/NotificationComponent";
// Import your pages here
import Login from "./pages/login";
import Signup from "./pages/signup";
import HomePage from "./pages/homepage";
import SellerDashboard from "./pages/sellerdashboard";
import WatchList from "./pages/watchlist";
import BiddingHistory from "./pages/biddinghistory";
import CurrentBids from "./pages/currentbids";
import CreateListing from "./pages/create_listing";
import AccountSummary from "./pages/accountsummary";
import CurrentListings from "./pages/current_listings";

import WeeklyProfits from "./pages/manager/profits";
import CustomerTable from "./pages/manager/custinfo";
import MAuthReq from "./pages/manager/authreq";
import SearchExperts from "./pages/manager/searchexp";

import EAuthRequests from "./pages/expert/expertauthreq";
import EnlargedExpertAuthRequest from "./pages/expert/enlargedexpertauthrequest";
import Profile from "./pages/expert/profile";
import Navbar from "./components/navbar";

// Creates a global state to store user information and CSRF token information
// Makes it available to ANY component in the app
export const UserContext = createContext();
export const CSRFContext = createContext();

// Makes it so components can be accessed without needing the Provider directly.
export const useUser = () => useContext(UserContext);
export const useCSRF = () => useContext(CSRFContext);

// Global function to fetch CSRF token from backend
export const fetchCSRFToken = async () => {
    try {
        const response = await fetch(
            "http://localhost:5000/api/get-csrf-token",
            {
                method: "GET",
                credentials: "include",
            }
        );
        const data = await response.json();
        return data.csrf_token;
    } catch (error) {
        console.error("Error fetching CSRF token:", error);
        return null;
    }
};

// ORDER MATTERS. DO NOT MOVE THIS BELOW THE function App(){...}
// DO NOT MOVE THIS CODE PLEASE OR ALTER IT PLEASE

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [csrfToken, setCsrfToken] = useState("");
    const [isLoading, setIsLoading] = useState(true); // Add this line

    useEffect(() => {
        const createContext = async () => {
            try {
                // Fetch CSRF token
                const token = await fetchCSRFToken();
                if (token) setCsrfToken(token);

                // Fetch current user
                const response = await fetch(
                    "http://localhost:5000/api/get_current_user",
                    {
                        credentials: "include",
                    }
                );

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                console.error("Error: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        createContext();
    }, []);

    if (isLoading) {
        return;
    }

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <CSRFContext.Provider value={{ csrfToken, setCsrfToken }}>
                {children}
            </CSRFContext.Provider>
        </UserContext.Provider>
    );
};

function App() {
    const [activeSubMenu, setActiveSubMenu] = useState(null); // Tracks which submenu is active
    const [searchQuery, setSearchQuery] = useState(""); // Tracks user search input

    // Function to handle submenu toggle
    const toggleSubMenu = (menu) => {
        setActiveSubMenu(activeSubMenu === menu ? null : menu); // Toggle menu visibility
    };

    return (
        //Wraps the app in UserProvider
        <UserProvider>
            <Router>
                <NotificationProvider>
                    <div className="navbar">
                      <Navbar 
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
                      /> 
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
                                                <Route path="/current_listings" element={<CurrentListings />} />

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
                        <Route
                            path="/accountsummary"
                            element={<AccountSummary />}
                        />
                        <Route path="/home-page" element={<HomePage />} />
                        <Route
                            path="/seller-dash"
                            element={<SellerDashboard />}
                        />
                        <Route path="/watchlist" element={<WatchList />} />
                        <Route
                            path="/bidding-history"
                            element={<BiddingHistory />}
                        />
                        <Route
                        path="/current_listings"
                        element={<CurrentListings searchQuery={searchQuery} />}
                    />
                        <Route path="/current-bids" element={<CurrentBids />} />
                        <Route
                            path="/create-listing"
                            element={<CreateListing />}
                        />

                        <Route
                            path="/manager/profits"
                            element={<WeeklyProfits />}
                        />
                        <Route
                            path="/manager/customer"
                            element={<CustomerTable />}
                        />
                        <Route path="/manager/auth" element={<MAuthReq />} />
                        <Route
                            path="/manager/expertSearch"
                            element={<SearchExperts />}
                        />

                        <Route
                            path="/expert/auth"
                            element={<EAuthRequests />}
                        />
                        <Route
                            path="/expert/auth/:Listing_name/:Item_id"
                            element={<EnlargedExpertAuthRequest />}
                        />
                        <Route path="/expert/profile" element={<Profile />} />
                    </Routes>
                </NotificationProvider>
            </Router>
        </UserProvider>
    );
}

export default App;
