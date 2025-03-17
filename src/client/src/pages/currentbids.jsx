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
            const response = await fetch("http://localhost:5000/api/get-bids", {
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
                            ...item
                        }))
                    );
                } else {
                    console.log("No items currently bidded");
                }
            }
        } catch (error) {
            console.error("Error fetching bids:", error);
        }
    };

    // Gets bidding history when the page loads for the first time
    useEffect(() => {
        if (user?.level_of_access === 1) {
            getBids();
        } else {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Current Bids
                </h1>
                <p className="text-xl text-gray-500 mt-2">
                    View items you are currently bidding on.
                </p>
            </div>
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
                                availableUntil={item.Available_until}
                                buttons={
                                    item.Successful_bid == 1
                                        ? [
                                            {
                                                text: "Highest Bidder",
                                                style: "bg-green-500 text-white",
                                            },
                                            {
                                                text: `Your Bid: £${item.Bid_price}`,
                                                style: "bg-gray-200 text-black",
                                            },
                                        ]
                                        : [
                                            { text: "Out Bid", style: "bg-red-500 text-white" },
                                            {
                                                text: `Your Bid: £${item.Bid_price}`,
                                                style: "bg-gray-200 text-black",
                                            },
                                            {
                                                text: `Highest Bid: £${item.Current_bid}`,
                                                style: "bg-gray-500 text-white",
                                            },
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
