import React, { useState, useEffect } from "react";
import ItemListing from "../components/itemlisting";
import { useUser, useCSRF } from "../App";
import { useNavigate } from "react-router-dom";



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

    // Function to fetch bidding history from the server
    const getBids = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/get-bids",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    credentials: "include",
                }
            );

            // Waits for the server response
            const data = await response.json();

            if (response.ok) {
                if (Array.isArray(data.bids)) {
                    setBids(
                        data.bids.map((item) => ({
                            ...item,
                            timeRemaining: calculate_time_remaining(item.Available_until),
                        }))
                    );
                }
                else {
                    console.log("No items currently bidded");
                }
            }
        } catch (error) {
            console.error("Error fetching bids:", error);
        }
    };

    // Calculate time remaining dynamically (with seconds)
    const calculate_time_remaining = (availableUntil) => {
        const endTime = new Date(availableUntil).getTime();
        const now = new Date().getTime();
        const diffMs = endTime - now;

        if (diffMs <= 0) {
            const expiredDate = new Date(availableUntil).toLocaleString();
            return `Expired on ${expiredDate}`;
        }

        // Calculate hours, minutes, and seconds
        const seconds = Math.floor((diffMs / 1000) % 60);
        const minutes = Math.floor((diffMs / 60000) % 60);
        const hours = Math.floor((diffMs / 3600000));

        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    // Gets bidding history when the page loads for the first time
    useEffect(() => {
        if (user) {
            getBids();
        }
    }, [user]);

    // Live update timer
    useEffect(() => {
        const interval = setInterval(() => {
            setBids((prev) =>
                prev.map((item) => ({
                    ...item,
                    timeRemaining: calculate_time_remaining(item.Available_until),
                }))
            );
        }, 1000); // Update every second

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);


    return (
        <div className="container p-6">
            <h1 className="text-3xl font-bold mb-6">Current Bids</h1>
            {user ? (
                bids.length > 0 ? (
                    <div className="space-y-6">
                        {bids.map((item) => (
                            <ItemListing
                                key={item.Bid_id}
                                title={item.Listing_name}
                                seller={item.Seller_name}
                                description={item.Description}
                                images={item.Images}
                                labels={[`Time Left: ${item.timeRemaining}`]}
                                buttons={
                                    item.Successful_bid == 1 ? [
                                        { text: "Highest Bidder", style: "bg-green-500 text-white" },
                                        { text: `Your Bid: £${item.Bid_price}`, style: "bg-gray-200 text-black" },
                                    ] : [
                                        { text: "Out Bid", style: "bg-red-500 text-white" },
                                        { text: `Your Bid: £${item.Bid_price}`, style: "bg-gray-200 text-black" },
                                        { text: `Highest Bid: £${item.Current_bid}`, style: "bg-gray-500 text-white" },
                                    ]
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">You have no current bids.</p>
                )
            ) : (
                <p className="text-gray-600">Login to see Current Bids</p>
            )}
        </div>
    );
};

export default CurrentBids;