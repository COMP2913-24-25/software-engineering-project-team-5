import React, { useEffect } from "react";
import { useUser, useCSRF } from "../App";
import { useNavigate } from "react-router-dom";

const LogOut = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const { csrfToken } = useCSRF();

    useEffect(() => {
        const handle_logout = async () => {
            if (!user) return; // Prevent unnecessary calls

            const response = await fetch("http://localhost:5000/api/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });

            if (response.ok) {
                setUser(null);
                alert("Log Out Successful!");
                navigate("/");
            } else {
                console.error("Error logging out");
            }
        };

        handle_logout();
    }, [user]);

    return null;
};

export default LogOut;
