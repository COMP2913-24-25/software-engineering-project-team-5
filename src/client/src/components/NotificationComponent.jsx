import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

// Create Notification Context
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const prevPendingCount = useRef(0); // useRef to store the previous pending count

    const notify = (message, path) => {
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
    // can addany trigger this is for when new authenticated item is added
    const checkNewAuthRequests = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/get-experts-authentication-requests",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (response.ok) {
                const newCount = data.pending_auth_requests?.length || 0;
                
                if (newCount > prevPendingCount.current) {
                    notify("New authentication request assigned! (Click to view)", "/expert/auth");
                }

                prevPendingCount.current = newCount; // Update the previous pending count
                setPendingCount(newCount);
            }
        } catch (error) {
            console.error("Error checking authentication requests:", error);
        }
    };

    useEffect(() => {
        const interval = setInterval(checkNewAuthRequests, 10000); //every 10 seconds check
        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <ToastContainer />
        </NotificationContext.Provider>
    );
};

// Custom hook for accessing notifications
export const useNotification = () => useContext(NotificationContext);