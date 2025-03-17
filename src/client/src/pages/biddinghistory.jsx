import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App";
import ItemListing from "../components/itemlisting";
import { useNavigate } from "react-router-dom";

const BiddingHistory = () => {
    /*  
    Allows user to see items that they previous bidded on (items that have expired), it has functionality
    to filter the bids and sort them too. Per item is shows an image of it, the name, the sellers name,
    the product description, time remaining, and the status. 
    */

    const { user } = useUser();
    const navigate = useNavigate();

    // Variable to store the bids stored and bidding history
    const [history, setHistory] = useState([]);

    const { csrfToken } = useCSRF();

    // Function to fetch bidding history from the server
    const getHistory = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/get-history", {
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
                if (Array.isArray(data.history)) {
                    setHistory(data.history);
                } else {
                    console.log("No items in history");
                }
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    // Gets bidding history when the page loads for the first time
    useEffect(() => {
        if (user?.level_of_access === 1) {
            getHistory();
        } else {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Bidding History
                </h1>
                <p className="text-xl text-gray-500 mt-2">
                    View items that you have previously bidded on.
                </p>
            </div>

            {user ? (
                history.length === 0 ? (
                    <p className="text-gray-600">You have no expired auctions.</p>
                ) : (
                    <div className="space-y-4">
                        {history.map((item, index) => (
                            <ItemListing
                                key={index}
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
                                            {
                                                text: "View Receipt",
                                                style: "bg-blue-500 text-white",
                                            },
                                        ]
                                        : [
                                            {
                                                text: "Out Bid",
                                                style: "bg-red-500 text-white",
                                            },
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
                )
            ) : (
                <p className="text-gray-600">Login to see Bidding History</p>
            )}      
      
        </div>
    );
};

export default BiddingHistory;
