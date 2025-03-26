import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../App";
import { get_notification_socket, release_notification_socket } from "../hooks/notification_socket";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useUser();
    const navigate = useNavigate();
    const notificationSocketRef = useRef(null);

    // Function to notify the user of an event
    const notify = (message, path) => {
        toast.info(
            <span onClick={() => navigate(path)} style={{ cursor: "pointer" }}>
                {message}
            </span>,
            {
                position: "top-right",
                autoClose: 9000,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                role: "alert",
            }
        );
    };

    useEffect(() => {
        if (!user) return;

        // Initialize the notification socket
        notificationSocketRef.current = get_notification_socket();
        const socket = notificationSocketRef.current;

        // On successful connection, join the notifications room
        socket.on("connect", () => {
            socket.emit("join_notifications");
        });

        // When outbid on an item, show a notification
        socket.on("outbid_notification", (data) => {
            notify(
                `You've been outbid on "${data.item_name}" with a bid of £${data.outbid_price}`,
                "/current-bids"
            );
        });

        // When an auction is won, show a notification
        socket.on("auction_won", (data) => {
            notify(
                `You won the auction for "${data.item_name}" at £${data.winning_price}!`,
                "/bidding-history"
            );
        });

        // When an auction is lost, show a notification
        socket.on("auction_lost", (data) => {
            notify(
                `You lost the auction for "${data.item_name}" (sold for £${data.winning_price})`,
                "/bidding-history"
            );
        });

        // When a new authentication request is made, show a notification
        socket.on("new_auth_request", (data) => {
            if (user?.level_of_access === 2) {
                notify(`New authentication request for "${data.item_name}"`, "/expert/auth");
            }
        });

        socket.emit("join_notifications");

        return () => {
            // Clean up the socket event listeners
            socket.off("connect");
            socket.off("outbid_notification");
            socket.off("auction_won");
            socket.off("auction_lost");
            socket.off("new_auth_request");
            release_notification_socket();
        };
    }, [user]);

    const emitNotificationEvent = (event, data) => {
        // Function to emit a notification event, allowing the
        // socket to be used from other pages
        if (notificationSocketRef.current?.connected) {
            notificationSocketRef.current.emit(event, data);
        }
    };

    return (
        <NotificationContext.Provider value={{ notify, emitNotificationEvent }}>
            {children}
            <ToastContainer aria-live="polite" role="alert" />
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
