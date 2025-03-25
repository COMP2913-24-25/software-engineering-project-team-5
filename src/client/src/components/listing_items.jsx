import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../App"; // Calls the user
import config from "../../config";

const Listing_item = (props) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [wishlist, set_wishlist] = useState(false);
    const [time_left, set_time_left] = useState("00:00:00");
    const item = props.item;
    const available_until = new Date(item.Available_until).getTime();
    const { csrfToken } = useCSRF(); // Get the CSRF token
    const { api_base_url } = config;

    const handleClick = () => {
        {
            if (item.Authentication_request === true && item.Expert_id !== null) {
                // Under review item
                let url =
                    "/authrequest/" + encodeURIComponent(item.Listing_name) + "/" + item.Item_id;
                navigate(url);
            } else {
                // Regular item details page
                navigate(`/item/${encodeURIComponent(item.Listing_name)}/${item.Item_id}`);
            }
        }
    };

    const toggle_wishlist = async (item_id) => {
        if (!user) return;

        try {
            const response = await fetch(
                `${api_base_url}/api/${wishlist ? "remove-watchlist" : "add-watchlist"}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    credentials: "include",
                    body: JSON.stringify({ item_id }),
                }
            );

            const data = await response.json();
            if (response.ok) {
                set_wishlist(!wishlist);
            } else {
                console.error("Error:", data.message);
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while updating the watchlist.");
        }
    };

    const check_watchlist = async () => {
        if (!user) return;

        try {
            const response = await fetch(
                `${api_base_url}/api/check-watchlist?Item_id=${item.Item_id}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                }
            );

            const data = await response.json();
            if (response.ok) {
                set_wishlist(data.in_watchlist);
            } else {
                console.error("Error2:", data.message);
            }
        } catch (error) {
            console.error("Error2:", error);
            alert("An error occurred while checking the watchlist.");
        }
    };

    useEffect(() => {
        const calculate_time_left = () => {
            const time_now = new Date().getTime();
            const difference_time = available_until - time_now;

            if (difference_time > 0) {
                const hours = Math.floor(difference_time / (1000 * 60 * 60));
                const minutes = Math.floor((difference_time % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference_time % (1000 * 60)) / 1000);

                set_time_left(
                    `${hours.toString().padStart(2, "0")}:${minutes
                        .toString()
                        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
                );
            } else {
                set_time_left("00:00:00");
            }
        };

        const timer = setInterval(calculate_time_left, 1000);
        return () => clearInterval(timer);
    }, [item.Available_until]);

    useEffect(() => {
        if (user) {
            check_watchlist();
        }
    }, [user, item.Item_id]);

    return (
        <div className="flex flex-wrap justify-center gap-5 mb-8" role="list">
            <div
                className="w-[300px] border border-gray-300 rounded-lg overflow-hidden bg-gray-100 transition-transform transform hover:scale-105 cursor-pointer flex flex-col items-center"
                onClick={handleClick}
                role="listitem"
                aria-label={`Listing: ${item.Listing_name}`}
            >
                <div className="w-full h-[180px] bg-gray-200 flex items-center justify-center overflow-hidden relative">
                    {user && user.level_of_access === 1 && (
                        <button
                            className={`absolute top-2 right-2 cursor-pointer text-xl ${
                                wishlist ? "text-red-600" : "text-white"
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggle_wishlist(item.Item_id);
                            }}
                            aria-label={wishlist ? "Remove from watchlist" : "Add to watchlist"}
                            aria-pressed={wishlist}
                        >
                            ♥
                        </button>
                    )}
                    <img
                        src={`data:image/${item.Image};base64,${item.Image}`}
                        alt={item.Listing_name}
                        className="w-full h-full object-cover"
                        aria-hidden="false"
                    />
                </div>
    
                <div className="p-4 w-full font-sans">
                    <div className="flex justify-between items-center font-bold mb-2">
                        <span className="text-blue-600 hover:underline" aria-label="Listing name">
                            {item.Listing_name}
                        </span>
                        {item.Verified && (
                            <span className="text-yellow-500 text-xl" aria-label="Verified item">
                                ★
                            </span>
                        )}
                    </div>
    
                    <div className="flex justify-between items-center text-sm text-gray-700">
                        <span aria-label={`Seller: ${item.Seller_username}`}>
                            {item.Seller_username}
                        </span>
                        <span aria-label={`Current price: £${Math.max(item.Current_bid, item.Min_price).toFixed(2)}`}>
                            £
                            {item.Current_bid > item.Min_price
                                ? item.Current_bid.toFixed(2)
                                : item.Min_price.toFixed(2)}
                        </span>
                    </div>
    
                    <div
                        className={`flex justify-between items-center text-sm ${
                            new Date(item.Available_until) - new Date() < 12 * 60 * 60 * 1000
                                ? "text-red-600"
                                : "text-gray-700"
                        }`}
                        aria-label={`Time remaining: ${time_left}`}
                    >
                        <span>{time_left}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Listing_item;
