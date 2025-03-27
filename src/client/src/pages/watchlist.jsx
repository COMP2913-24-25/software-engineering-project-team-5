import React, { useState, useEffect } from "react";
import ItemListing from "../components/itemlisting";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../App"; // Calls the user
import config from "../../config";

const Watchlist = () => {
    const { user } = useUser();
    const [watchlist, setWatchlist] = useState([]);
    const navigate = useNavigate();
    const { csrfToken } = useCSRF(); // Get the CSRF token
    const { api_base_url } = config;
    const [loading, setLoading] = useState(true);


    // Fetch watchlist data
    const get_watchlist = async () => {
        try {
            const response = await fetch(`${api_base_url}/api/get-watchlist`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken, // Include CSRF token in header
                },
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                if (Array.isArray(data.watchlist)) {
                    setWatchlist(
                        data.watchlist.map((item) => ({
                            ...item,
                        }))
                    );
                } else {
                    console.log("No items in watchlist");
                }
            } else {
                console.error("Invalid watchlist data:", data);
            }
        } catch (error) {
            console.error("Error fetching watchlist:", error);
        } finally {
            setLoading(false);
        }
    };

    // Remove item from watchlist
    const remove_from_watchlist = async (item_id) => {
        if (!user) return;

        try {
            const response = await fetch(`${api_base_url}/api/remove-watchlist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken, // Include CSRF token in header
                },
                credentials: "include",
                body: JSON.stringify({ item_id }),
            });

            if (response.ok) {
                setWatchlist((prev) => prev.filter((item) => item.Item_id !== item_id));
            } else {
                const data = await response.json();
                console.error("Error removing item:", data.message);
            }
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    useEffect(() => {
        if (user?.level_of_access === 1) {
            get_watchlist(); // Fetch the watchlist only if the user is logged in
        } else {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div role="main" className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <header className="text-center mb-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">Watchlist</h1>
                    <p className="text-xl text-gray-500 mt-2">Track items you are interested in.</p>
                </div>
            </header>
            {loading ? (
                <div className="py-20 text-center text-gray-600">
                    <div className="flex justify-center items-center">
                        <div className="w-16 h-16 border-t-4 border-blue-600 border-dashed rounded-full animate-spin" role="status" aria-label="Loading current bids"></div>
                    </div>
                    <p>Loading listings...</p>
                </div>
            ) : (
                user ? (
                    watchlist.length === 0 ? (
                        <p aria-live="polite" className="text-gray-600">Your watchlist is empty.</p>
                    ) : (
                        <div className="space-y-6">
                            {watchlist.map((item) => (
                                <ItemListing
                                    key={item.Item_id}
                                    itemId={item.Item_id}
                                    images={item.Images}
                                    title={item.Listing_name}
                                    seller={item.Seller_name}
                                    description={item.Description}
                                    availableUntil={item.Available_until}
                                    labels={[
                                        `Current Bid: £${Number(item.Current_bid) > Number(item.Min_price)
                                            ? Number(item.Current_bid).toFixed(2)
                                            : Number(item.Min_price).toFixed(2)
                                        }`,
                                    ]}
                                    buttons={[
                                        {
                                            text: "Remove from Watchlist",
                                            onClick: () => remove_from_watchlist(item.Item_id),
                                            style: "bg-red-500 text-white hover:bg-red-600",
                                            "aria-label": `Remove ${item.Listing_name} from watchlist`,
                                        },
                                    ]}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <p className="text-gray-600">Login to see Watchlist</p>
                )
            )}
        </div>
    );
};

export default Watchlist;
