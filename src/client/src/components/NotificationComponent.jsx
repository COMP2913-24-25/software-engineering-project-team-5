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
    const [notifiedItemsBidPair, setNotifiedItemsBidPair] = useState({}); // to store the id and the price that has been out bid on (to prevent ongoing notifications for the same outbidding)

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
                    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken,},
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

    // Check for Expired Auctions to charge @Mila
    const chargeExpiredAuctions = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/charge-expired-auctions",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken,},
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (response.ok) {
                console.log("Expired auctions have been charged from NotificationComponent");
                // notify("Expired auctions have been charged!", "/bidding-history");
            }
        } catch (error) {
            console.error("Error checking authentication requests:", error);
        }
    };

    // Check for Expired Auctions to charge @Mila
    const check_for_outbiddings = async () => {
        console.log("\n-----------------");
        console.log("check_for_outbiddings");
        try {
            const response = await fetch(
                "http://localhost:5000/api/outbid-notification-check",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken,},
                    credentials: "include",
                }
            );

            const data = await response.json();
            console.log("Checking outbid notifications from server: \n");
            // Status: 0=error, 1=outbid, 2=not outbid
            console.log(data);
            if (response.ok) {
                console.log("RESPONSE IS OKAY: check_for_outbiddings: \n");
                //notification_list = ({"status" "User_ID_outbid", "Item_ID", "Item_Name", "Outbid_Price", "message"});
                const notification_list = data.outbid_notification_list;
                console.log("NOTIFICATION LIST: ", notification_list);

                // Use a separate function to update the state
                updateNotifiedItemsBidPair(notification_list);
            } else {
                console.error("Error checking outbid notifications from server");
            }
        } catch (error) {
            console.error("Error checking for outbiddings", error);
        }
    };

    // Separate function to update the state
    const updateNotifiedItemsBidPair = (notification_list) => {
        setNotifiedItemsBidPair((prev) => {
            const updatedPairs = { ...prev };
            for (const notification of notification_list) {
                console.log("NOTIFICATION", notification);
                const new_outbid_pair = { ItemID: notification.Item_ID, OutbidPrice: notification.Outbid_Price };
                const old_outbid_pair = prev[notification.ItemID] || { OutbidPrice: 0 };
                console.log("OLD OUTBID PAIR: ", old_outbid_pair);
                console.log("NEW OUTBID PAIR: ", new_outbid_pair);

                if (!prev.hasOwnProperty(notification.ItemID)) {
                    console.log("You have been outbid for the first time for the item '" + notification.Item_Name + "' with a bid of " + notification.Outbid_Price + "!");
                    notify("You have been outbid for the first time for the item '" + notification.Item_Name + "' with a bid of " + notification.Outbid_Price + "!", "/current-bids");
                    updatedPairs[notification.ItemID] = new_outbid_pair;
                } else {
                    if (new_outbid_pair.OutbidPrice > old_outbid_pair.OutbidPrice) {
                        console.log("You have been outbid for the item '" + notification.Item_Name + "' with a bid of " + notification.Outbid_Price + "!");
                        notify("You have been outbid for the item '" + notification.Item_Name + "' with a bid of " + notification.Outbid_Price + "!", "/current-bids");
                        updatedPairs[notification.ItemID] = new_outbid_pair;
                    } else {
                        console.log("A reminder you have been outbid for the item '" + notification.Item_Name + "' with a bid of " + notification.Outbid_Price + "!");
                    }
                }
            }
            console.log("UPDATED PAIRS: ", updatedPairs);
            return updatedPairs;
        });
    };

    // Log the state after it has been updated
    useEffect(() => {
        console.log("ITEM PAIRS: ", notifiedItemsBidPair);
    }, [notifiedItemsBidPair]);

    useEffect(() => {
        if (user?.level_of_access === 2) {
            const interval = setInterval(checkNewAuthRequests, 10000); // every 10 seconds check
            return () => clearInterval(interval);
        }
    }, []);

    // useEffect to charge expired auctions for all users
    useEffect(() => {
        const interval = setInterval(chargeExpiredAuctions, 10000); // every 10 seconds check
        return () => clearInterval(interval);
    }, []);

    // useEffect to check for outbiddings for all users
    useEffect(() => {
        const interval = setInterval(check_for_outbiddings, 10000); //every 10 second check
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