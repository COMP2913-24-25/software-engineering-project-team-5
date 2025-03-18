import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../App";

// Create Notification Context
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useUser();
    const { csrfToken } = useCSRF();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const prevPendingCount = useRef(0); // useRef to store the previous pending count

    const notify = (message, path) => {
        console.log("Notification Triggered");
        toast.info(
            <span onClick={() => navigate(path)} style={{ cursor: "pointer" }}>
                {message}
            </span>,
            {
                position: "top-right",
                autoClose: 3000,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            }
        );
        setNotifications((prev) => [...prev, message]);
    };

    // Function to check for new authentication requests
    const checkNewAuthRequests = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/get-experts-authentication-requests",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
                    credentials: "include",
                }
            );

            const data = await response.json();
            console.log("Pending Auth Requests: ", data.pending_auth_requests);

            if (response.ok) {
                const newCount = data.pending_auth_requests?.length || 0;

                // Notify only if the count increases
                if (newCount > prevPendingCount.current) {
                    notify("New authentication request assigned! (Click to view)", "/expert/auth");
                }

                prevPendingCount.current = newCount; // Update the previous pending count
                setPendingCount(newCount); // Update state with the new count
            }
        } catch (error) {
            console.error("Error checking authentication requests:", error);
        }
        console.log("User: ", user);
    };

    useEffect(() => {
        if (user?.level_of_access === 2) {
            // Set interval to check for new auth requests every 10 seconds
            const interval = setInterval(checkNewAuthRequests, 10000);
            return () => clearInterval(interval);
        }
    }, [user]); 

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <ToastContainer />
        </NotificationContext.Provider>
    );
};

// Custom hook for accessing notifications
export const useNotification = () => useContext(NotificationContext);