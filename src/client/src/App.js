import React, {useState, useEffect} from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import your pages here
import Login from "./pages/login";
import Signup from "./pages/signup";

function App() {
    // add the route to all pages
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={<Navigate to="/signup" />} />
            </Routes>
        </Router>
    );
}

export default App;


