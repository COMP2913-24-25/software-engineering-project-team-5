import React, { useState, useEffect } from "react";
import { useUser } from "../App";

const CurrentBids = () => {
    /*  
    Allows user to see items that have bids on currently, it has functionality
    to filter the bids and sort them too. Per item is shows an image of it, the name, the sellers name,
    the product description, time remaining, and the status.  
    */

    const { user } = useUser();

    // Variable to store the bids stored and bidding history
    const [bids, setBids] = useState([]);

    // Function to fetch bidding history from the server
    const getBids = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/get-bids",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                }
            );

            // Waits for the server response
            const data = await response.json();

            if (response.ok) {
                setBids(data.bids);
            }
        } catch (error) {
            console.error("Error fetching bids:", error);
        }
    };

    // Calculate time remaining dynamically (with seconds)
    const calculateTimeRemaining = (availableUntil) => {
        const endTime = new Date(availableUntil).getTime();
        const now = new Date().getTime();
        const diffMs = endTime - now;

        if (diffMs <= 0) return "Expired";

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
                    timeRemaining: calculateTimeRemaining(item.Available_until),
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
                    <div className="space-y-4">
                        {bids.map((item, index) => (
                            <ItemListing
                                key={index}
                                title={item.Listing_name}
                                seller={item.Seller_name}
                                description={item.Description}
                                image={item.Image}
                                labels={[`Time Left: ${item.timeRemaining}`]}
                                buttons={
                                    item.Successful_bid === 1
                                        ? [
                                            { text: "Highest Bidder", style: "bg-green-500 text-white" },
                                            { text: `Your Bid: £${item.Bid_price}`, style: "bg-gray-200 text-black" },
                                        ]
                                        : [
                                            { text: "Out Bid", style: "bg-red-500 text-white" },
                                            { text: `Your Bid: £${item.Bid_price}`, style: "bg-gray-200 text-black" },
                                            { text: `Highest Bid: £${item.Current_bid}`, style: "bg-blue-500 text-white" },
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