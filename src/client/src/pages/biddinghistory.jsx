import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App";
import ItemListing from "../components/itemlisting";
import { useNavigate } from "react-router-dom";
import Bid_Status_component from "../components/bid_status_filter";
import config from "../../config";

const BiddingHistory = () => {
    /*  
    Allows user to see items that they previous bidded on (items that have expired), it has functionality
    to filter the bids and sort them too. Per item is shows an image of it, the name, the sellers name,
    the product description, time remaining, and the status. 
    */

    const { user } = useUser();
    const navigate = useNavigate();
    const { api_base_url } = config;

    // Variable to store the bids stored and bidding history
    const [history, setHistory] = useState([]);

    const { csrfToken } = useCSRF();
    const [filtered_listings, setfiltered_listings] = useState([]); // Stores bid-status-filtered data
    // Function to fetch bidding history from the server
    const getHistory = async () => {
        try {
            const response = await fetch(`${api_base_url}/api/get-history`, {
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
                    setfiltered_listings(data.history);
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

    const handle_filtered_listings = (filtered_listings) => {
        // console.log("Filtered being set ", filtered_listings);

        setfiltered_listings(filtered_listings);
    };
    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="text-center mb-8">
                <h1 aria-label="Bidding History Page" className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Bidding History
                </h1>
                <Bid_Status_component aria-label="Filter your bidding history by bid status" update_listings={handle_filtered_listings} listings={history} />


                <p className="text-xl text-gray-500 mt-2">
                    View items that you have previously bidded on.
                </p>
            </div>

            {user ? (
                filtered_listings.length === 0 ? (
                    <p role="status" className="text-gray-600">You have no expired auctions.</p>
                ) : (
                    <div aria-live="polite" className="space-y-4">
                        {filtered_listings.map((item, index) => (
                            <ItemListing
                                key={index}
                                itemId={item.Item_id}
                                title={item.Listing_name}
                                seller={item.Seller_name}
                                description={item.Description}
                                images={item.Images}
                                availableUntil={item.Available_until}
                                tags={item.Tags}
                                buttons={
                                    item.Successful_bid == 1 ? (
                                        item.Winning_bid == 1 ? (
                                            [
                                                {
                                                    text: "Auction Won",
                                                    style: "bg-green-500 text-white",
                                                    "aria-label": "You won the auction",
                                                },
                                                {
                                                    text: `Your Bid: £${item.Bid_price}`,
                                                    style: "bg-gray-200 text-black",
                                                    "aria-label": `Your bid was £${item.Bid_price}`,
                                                },
                                            ]
                                        ) : (
                                            [
                                                {
                                                    text: "Payment Incomplete",
                                                    style: "bg-yellow-500 text-white",
                                                    "aria-label": "Payment is incomplete for this auction",
                                                },
                                                {
                                                    text: `Your Bid: £${item.Bid_price}`,
                                                    style: "bg-gray-200 text-black",
                                                    "aria-label": `Your bid was £${item.Bid_price}`,
                                                },
                                            ]
                                        )
                                    ) : (
                                        [
                                            {
                                                text: "Out Bid",
                                                style: "bg-red-500 text-white",
                                                "aria-label": "You were outbid in this auction",
                                            },
                                            {
                                                text: `Your Bid: £${item.Bid_price}`,
                                                style: "bg-gray-200 text-black",
                                                "aria-label": `Your bid was £${item.Bid_price}`,

                                            },
                                            {
                                                text: `Highest Bid: £${item.Current_bid}`,
                                                style: "bg-gray-500 text-white",
                                                "aria-label": `The highest bid was £${item.Current_bid}`,
                                            },
                                        ]
                                    )

                                }
                            />
                        ))}
                    </div>
                )
            ) : (
                <p role="status" className="text-gray-600">Login to see Bidding History</p>
            )}
        </div>
    );
};

export default BiddingHistory;
