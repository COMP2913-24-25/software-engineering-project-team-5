import React, { useEffect } from "react";
import { useUser, useCSRF } from "../App";
import { useNavigate } from "react-router-dom";

const LogOut = () => {
    /*
    Function to log the user out of their account
    Returns nothing - redirects to login page after
    successful logout
    */
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const { csrfToken } = useCSRF();

    useEffect(() => {
        const handle_logout = async () => {
            // Only calls logout if user is logged in
            if (!user) return;

            const response = await fetch("http://localhost:5000/api/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });

            if (response.ok) {
                // Removed session data for user
                setUser(null);

                // Navigates to login page
                navigate("/login");
            }
        };

        handle_logout();
    }, [user]);

    return null;
};

export default LogOut;
