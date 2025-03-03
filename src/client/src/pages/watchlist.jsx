import React, { useState, useEffect } from "react";
import { useUser } from "../App";
import ItemListing from "../components/itemlisting";

const Watchlist = () => {
    const { user } = useUser();
    const [watchlist, setWatchlist] = useState([]);

    // Fetch watchlist data
    const getWatchlist = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/get-watchlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                setWatchlist(
                    data.watchlist.map((item) => ({
                        ...item,
                        timeRemaining: calculateTimeRemaining(item.Available_until),
                    }))
                );
            }
        } catch (error) {
            console.error("Error fetching watchlist:", error);
        }
    };

    // Remove item from watchlist
    const removeFromWatchlist = async (Item_id) => {
        // try {
        //     const response = await fetch("http://localhost:5000/api/remove-watchlist", {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         credentials: "include",
        //         body: JSON.stringify({ Item_id }),
        //     });

        //     if (response.ok) {
        setWatchlist((prev) => prev.filter((item) => item.Item_id !== Item_id));
        //     }
        // } catch (error) {
        //     console.error("Error removing item:", error);
        // }
    };

    // Calculate time remaining dynamically (with seconds)
    const calculateTimeRemaining = (availableUntil) => {
        const endTime = new Date(availableUntil).getTime();
        const now = new Date().getTime();
        const diffMs = endTime - now;

        if (diffMs <= 0) return "Expired"; // If the time has expired, return "Expired"

        // Calculate hours, minutes, and seconds
        const seconds = Math.floor((diffMs / 1000) % 60);
        const minutes = Math.floor((diffMs / 60000) % 60);
        const hours = Math.floor((diffMs / 3600000));

        // Return formatted time
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        if (user) {
            getWatchlist();  // Fetch the watchlist only if the user is logged in
        }
    }, [user]);

    // Live update timer
    useEffect(() => {
        const interval = setInterval(() => {
            setWatchlist((prev) =>
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
            <h1 className="text-3xl font-bold mb-6">Watch List</h1>

            {user ? (
                watchlist.length === 0 ? (
                    <p className="text-gray-600">Your watchlist is empty.</p>
                ) : (
                    <div className="space-y-6">
                        {watchlist.map((item) => (
                            <ItemListing
                                key={item.Item_id}
                                image={item.Image} // Pass base64 image to the ItemListing component
                                title={item.Listing_name}
                                seller={item.Seller_name}
                                description={item.Description}
                                labels={[
                                    `Current Bid: £${item.Current_bid}`,
                                    `Time Remaining: ${item.timeRemaining || calculateTimeRemaining(item.Available_until)}`,
                                ]}
                                buttons={[
                                    {
                                        text: "Remove from Watchlist",
                                        onClick: () => removeFromWatchlist(item.Item_id),
                                        style: "bg-red-500 text-white hover:bg-red-600",
                                    },
                                ]}
                            />
                        ))}
                    </div>
                )
            ) : (
                <p className="text-gray-600">Login to see Watchlist</p>
            )}
        </div>
    );
};

export default Watchlist;
