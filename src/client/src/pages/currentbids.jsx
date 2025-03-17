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
        if (user) {
            getBids();
        }
    }, [user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <h1 className="text-3xl font-bold mb-6">Current Bids</h1>
            {user ? (
                bids.length > 0 ? (
                    <div className="space-y-6">
                        {bids.map((item) => (
                            <ItemListing
                                key={item.Item_id}
                                itemId={item.Item_id}
                                images={item.Images}
                                title={item.Listing_name}
                                seller={item.Seller_name}
                                description={item.Description}
                                availableUntil={item.Available_until}
                                labels={[
                                    `Current Bid: £ ${Number(item.Current_bid) > Number(item.Min_price)
                                        ? Number(item.Current_bid).toFixed(2)
                                        : Number(item.Min_price).toFixed(2)
                                    }`,
                                ]}
                                buttons={[
                                    {
                                        text: "Remove from Watchlist",
                                        onClick: () => remove_from_watchlist(item.Item_id),
                                        style: "bg-red-500 text-white hover:bg-red-600",
                                    },
                                ]}
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
