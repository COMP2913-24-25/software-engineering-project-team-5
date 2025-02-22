import React from "react";
import { BrowserRouter as Router, Routes, Route, Link} from "react-router-dom";

// Import your pages here
import Login from "./pages/login";
import Signup from "./pages/signup";
import HomePage from "./pages/homepage";
import SellerDashboard from "./pages/sellerdashboard";
import WatchList from "./pages/watchlist";
import BiddingHistory from "./pages/biddinghistory";
import CurrentBids from "./pages/currentbids";


function App() {
    // add the route to all pages
    return (

        <Router>
        <div className="navbar">
          <Link to="/">login</Link>
          <Link to="/signup">signup</Link>
          <Link to="/home-page">homepage</Link>
          <Link to="/seller-dash">sellerdashboard</Link>
          <Link to="/watchlist">watchlist</Link>
          <Link to="/bidding-history">biddinghistory</Link>
          <Link to="/current-bids">currentbids</Link>
        </div>
  
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home-page" element={<HomePage />} />
          <Route path="/seller-dash" element={<SellerDashboard />} />
          <Route path="/watchlist" element={<WatchList />} />
          <Route path="/bidding-history" element={<BiddingHistory />} />
          <Route path="/current-bids" element={<CurrentBids />} />
        </Routes>
      </Router>


    );
}

export default App;


