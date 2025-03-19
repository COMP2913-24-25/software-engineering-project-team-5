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
    const [lossWinItems, setLossWinItems] = useState([]); // to store the id and the price that has been out bid on (to prevent ongoing notifications for the same outbidding)

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

    // can addany trigger this is for when new authenticated item is added
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

                if (newCount > prevPendingCount.current) {
                    notify("New authentication request assigned! (Click to view)", "/expert/auth");
                }

                prevPendingCount.current = newCount; // Update the previous pending count
                setPendingCount(newCount); // Update state with the new count
            }
        } catch (error) {
            console.error("Error checking authentication requests:", error);
        }

        console.log("CSRF Token: ", csrfToken);
        console.log("User: ", user);
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
                    console.log("You have been outbid for the first time for the item '" + notification.Item_Name + "' with a bid of £" + notification.Outbid_Price + "!");
                    notify("You have been outbid for the first time for the item '" + notification.Item_Name + "' with a bid of £" + notification.Outbid_Price + "!", "/current-bids");
                    updatedPairs[notification.ItemID] = new_outbid_pair;
                } else {
                    if (new_outbid_pair.OutbidPrice > old_outbid_pair.OutbidPrice) {
                        console.log("You have been outbid for the item '" + notification.Item_Name + "' with a bid of £" + notification.Outbid_Price + "!");
                        notify("You have been outbid for the item '" + notification.Item_Name + "' with a bid of £" + notification.Outbid_Price + "!", "/current-bids");
                        updatedPairs[notification.ItemID] = new_outbid_pair;
                    } else {
                        console.log("A reminder you have been outbid for the item '" + notification.Item_Name + "' with a bid of £" + notification.Outbid_Price + "!");
                    }
                }
            }
            console.log("UPDATED PAIRS: ", updatedPairs);
            return updatedPairs;
        });
    };
//lossWinItems, storeLossWinItems
    // Check for Expired Auctions to charge @Mila
    const check_for_winning_or_losing = async () => {

        console.log("check_for_winning_or_losing");
        try {
            const response = await fetch(
                "http://localhost:5000/api/get-notify-bid-end",
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
                    credentials: "include",
                }
            );

            const data = await response.json();
            console.log("Checking loss/win notifications from server: \n");
            // Status: 0=error, 1=outbid, 2=not outbid
            console.log(data);
            if (response.ok) {
                const notification_list = data.expired_items_list;
                console.log("NOTIFICATION LIST: ", notification_list);

                // Use a separate function to update the state
                notify_for_loss_win(notification_list);
            } else {
                console.error("Error checking outbid notifications from server");
            }
        } catch (error) {
            console.error("Error checking for outbiddings", error);
        }
    };

    // Separate function to update the state
    const notify_for_loss_win = (notification_list) => {
        setLossWinItems((prev) => {
          const updatedLossWinItems = Array.isArray(prev) ? [...prev] : [];
          for (const notification of notification_list) {
            console.log("NOTIFICATION (LWI)", notification);
            const new_won_lost_item = notification.item_id;
            console.log("LOSS WIN ITEMS: (prev) ", prev);
            console.log("LOSS WIN ITEMS: (lwi) ", updatedLossWinItems);
      
            if (!updatedLossWinItems.includes(notification.item_id)) {
              console.log("new win or loss");
              if (notification.user_won_id === user.user_id) {
                console.log("You have won the auction for the item '" + notification.item_name + "'!");
                notify("You have won the auction for the item '" + notification.item_name + "'!", "/bidding-history");
              } else if (notification.users_lost_id_list.includes(user.user_id)) {
                console.log("You have lost the auction for the item '" + notification.item_name + "'!");
                notify("You have lost the auction for the item '" + notification.item_name + "'!", "/bidding-history");
              }
              updatedLossWinItems.push(new_won_lost_item);
            } else {
              console.log("You have already been notified winning or losing for the item '" + notification.item_name + "'!");
            }
          }
          return updatedLossWinItems;
        });
      };

    // Log the state after it has been updated
    useEffect(() => {
        if (user?.level_of_access === 1) {
        console.log("ITEM PAIRS: ", notifiedItemsBidPair);
        console.log("LOSS WIN ITEMS: ", lossWinItems);
        }
    }, [notifiedItemsBidPair, lossWinItems]);

    useEffect(() => {
        if (user?.level_of_access === 2) {
            const interval = setInterval(checkNewAuthRequests, 10000); // every 10 seconds check
            return () => clearInterval(interval);
        }
    }, [user]);

    // useEffect to charge expired auctions for all users
    useEffect(() => {
        const interval = setInterval(chargeExpiredAuctions, 60000); // every 60 seconds check
        return () => clearInterval(interval);
    }, []);

    // useEffect to check for outbiddings for level 1 users
    useEffect(() => {
        if (user?.level_of_access === 1) {
        const interval = setInterval(check_for_outbiddings, 10000); // every 10 seconds check
        return () => clearInterval(interval);
        }
    }, []);

    // useEffect to check for win/loss for level 1 users
    useEffect(() => {
        if (user?.level_of_access === 1) {
        const interval = setInterval(check_for_winning_or_losing, 10000); // every 10 seconds check
        return () => clearInterval(interval);
        }
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