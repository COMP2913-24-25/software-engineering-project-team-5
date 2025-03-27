import React, { useState, useEffect, useRef } from "react";
import ItemListing from "../components/itemlisting";
import { useUser, useCSRF } from "../App";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import { get_notification_socket, release_notification_socket } from "../hooks/notification_socket";

const CurrentBids = () => {
    /*  
    Allows user to see items that have bids on currently, it has functionality
    to filter the bids and sort them too. Per item is shows an image of it, the name, the sellers name,
    the product description, time remaining, and the status.  
    */

    const { user } = useUser();

    // Variable to store the bids stored and bidding history
    const [bids, setBids] = useState([]);
    const navigate = useNavigate();

    const { csrfToken } = useCSRF();
    const { api_base_url } = config;
    const [loading, setLoading] = useState(true);

    const notificationSocketRef = useRef(null);

    // Function to fetch bidding history from the server
    const getBids = async () => {
        try {
            const response = await fetch(`${api_base_url}/api/get-bids`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });

            // Waits for the server response
            const data = await response.json();

            if (response.ok) {
                if (Array.isArray(data.bids)) {
                    setBids(
                        data.bids.map((item) => ({
                            ...item,
                        }))
                    );
                } else {
                    console.log("No items currently bidded");
                }
            }
        } catch (error) {
            console.error("Error fetching bids:", error);
        } finally {
            setLoading(false);
        }
    };

    // Gets bidding history when the page loads for the first time
    useEffect(() => {
        if (user?.level_of_access === 1) {
            getBids();

            // Initialize the notification socket
            notificationSocketRef.current = get_notification_socket();
            const socket = notificationSocketRef.current;

            // On successful connection, join the bids room
            socket.on("connect", () => {
                console.log("joined bids socket");
                socket.emit("join_get_bids");
            });

            // When a bid is updated, update the bids
            socket.on("bid_update", () => {
                getBids();
            });

            socket.emit("join_get_bids");

            return () => {
                // Clean up the socket event listeners and
                // releases the socket when component unmounts
                console.log("closed connection");
                socket.off("connect");
                socket.off("bid_update");
                release_notification_socket();
            };
        } else {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="mb-8 text-center">
                <h1
                    aria-label="Current Bids Page"
                    className="mb-4 text-2xl font-semibold text-center text-gray-800"
                >
                    Current Bids
                </h1>
                <p className="mt-2 text-xl text-gray-500">
                    View items you are currently bidding on.
                </p>
            </div>
            {loading ? (
                <div className="py-20 text-center text-gray-600">
                    <div className="flex justify-center items-center">
                        <div className="w-16 h-16 border-t-4 border-blue-600 border-dashed rounded-full animate-spin" role="status" aria-label="Loading current bids"></div>
                    </div>
                    <p>Loading listings...</p>
                </div>

            ) : user ? (
                bids.length > 0 ? (
                    <div aria-live="polite" className="space-y-6">
                        {bids.map((item) => (
                            <ItemListing
                                key={item.Bid_id}
                                itemId={item.Item_id}
                                title={item.Listing_name}
                                seller={item.Seller_name}
                                description={item.Description}
                                images={item.Images}
                                availableUntil={item.Available_until}
                                tags={item.Tags}
                                buttons={
                                    item.Successful_bid == 1
                                        ? [
                                              {
                                                  text: "Highest Bidder",
                                                  style: "bg-green-500 text-white",
                                                  "aria-label": "You are the highest bidder",
                                              },
                                              {
                                                  text: `Your Bid: £${item.Bid_price}`,
                                                  style: "bg-gray-200 text-black",
                                                  "aria-label": `Your bid is £${item.Bid_price}`,
                                              },
                                          ]
                                        : [
                                              { text: "Out Bid", style: "bg-red-500 text-white" },
                                              {
                                                  text: `Your Bid: £${item.Bid_price}`,
                                                  style: "bg-gray-200 text-black",
                                                  "aria-label": "You have been outbid",
                                              },
                                              {
                                                  text: `Highest Bid: £${item.Current_bid}`,
                                                  style: "bg-gray-500 text-white",
                                                  "aria-label": `The highest bid is £${item.Current_bid}`,
                                              },
                                          ]
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <p role="status" className="text-center text-gray-600">You have no current bids.</p>
                )
            ) : (
                <p role="status" className="text-gray-600">
                    Login to see Current Bids
                </p>
            )}
        </div>
    );
};

export default CurrentBids;
