import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App";
import ItemListing from "../components/itemlisting";

const BiddingHistory = () => {
    /*  
    Allows user to see items that they previous bidded on (items that have expired), it has functionality
    to filter the bids and sort them too. Per item is shows an image of it, the name, the sellers name,
    the product description, time remaining, and the status. 
    */

    const { user } = useUser();

    // Variable to store the bids stored and bidding history
    const [history, setHistory] = useState([]);

    const { csrfToken } = useCSRF();


    // Function to fetch bidding history from the server
    const getHistory = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/get-history",
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
                if (Array.isArray(data.history)) {
                    setHistory(data.history);
                }
                else {
                    console.log("No items in history");
                }
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        }
    };

    // Gets bidding history when the page loads for the first time
    useEffect(() => {
        if (user) {
            getHistory();
        }
    }, [user]);


    return (
        <div className="container p-6">
            <h1 className="text-3xl font-bold mb-6">Bidding history</h1>

            {user ? (
                history.length === 0 ? (
                    <p className="text-gray-600">You have no expired auctions.</p>
                ) : (
                    <div className="space-y-4">
                        {history.map((item, index) => (
                            <ItemListing
                                key={index}
                                itemId={item.Item_id}
                                title={item.Listing_name}
                                seller={item.Seller_name}
                                description={item.Description}
                                images={item.Images}
                                labels={[`Date Finished: ${item.Available_until}`]}
                                buttons={
                                    item.Successful_bid == 1 ? [
                                        { text: "Highest Bidder", style: "bg-green-500 text-white" },
                                        { text: `Your Bid: £${item.Bid_price}`, style: "bg-gray-200 text-black" },
                                        { text: "View reciept", style: "bg-gray-200 text-black" }
                                    ] : [
                                        { text: "Out Bid", style: "bg-red-500 text-white" },
                                        { text: `Your Bid: £${item.Bid_price}`, style: "bg-gray-200 text-black" },
                                        { text: `Highest Bid: £${item.Current_bid}`, style: "bg-gray-500 text-white" },
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
