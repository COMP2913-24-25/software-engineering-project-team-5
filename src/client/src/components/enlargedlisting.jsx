import React, { useState, useEffect } from "react";

import { useUser, useCSRF } from "../App"; // changed to include useUser
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Listing_item from "../components/listing_items";

const EnlargedListingPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const { csrfToken } = useCSRF();
    const params = useParams();
    const item_id = params.Item_id;
    const [sellerListings, setSellerListings] = useState([]);
    const [wishlist, set_wishlist] = useState(false);
    const [item, setItem] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageCount, setImageCount] = useState(0);

    // for bidding
    const [bidAmount, setBidAmount] = useState(0);

    const [timeRemaining, setTimeRemaining] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    const check_watchlist = async () => {
        if (!user) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/check-watchlist?Item_id=${item.Item_id}`,
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

    const toggle_wishlist = async (item_id) => {
        if (!user) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/${wishlist ? "remove-watchlist" : "add-watchlist"}`,
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

    const fetchListingInformation = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/get-single-listing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ Item_id: item_id }),
                credentials: "include",
            });
            const data = await response.json();
            console.log("API Response:", data);

            if (response.ok) {
                setItem(data);
                setImageCount(data.Images.length);
                if (data.Available_until) {
                    updateTimeRemaining(data.Available_until);
                } else {
                    console.warn("Available_until is missing from the response!");
                }
            }
        } catch (error) {
            console.error("Error fetching listing information:", error);
        }
    };

    const fetchSellerListings = async () => {
        if (!item?.Seller_id) return; // Ensure item is loaded before fetching
        setSellerListings([]);
        try {
            const response = await fetch("http://localhost:5000/api/get-seller-items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ Seller_id: item.Seller_id }),
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                console.log("Seller Listings API Response:", data);

                if (response.ok) {
                    setSellerListings(data);
                    console.log(sellerListings);
                } else {
                    console.warn("Seller listings is not an array!", data);
                    setSellerListings();
                }
            } else {
                console.error("Error fetching seller listings:", data);
            }
        } catch (error) {
            console.error("Request failed:", error);
        }
    };

    useEffect(() => {
        fetchListingInformation();
    }, []);

    useEffect(() => {
        if (item?.Available_until) {
            const interval = setInterval(() => {
                updateTimeRemaining(item.Available_until);
                checkIfExpired(item.Available_until);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        if (user && item) {
            check_watchlist();
        }
    }, []);

    useEffect(() => {
        if (item && user) {
            fetchSellerListings();
        }
    }, []);

    const updateTimeRemaining = (availableUntil) => {
        const endTime = new Date(availableUntil).getTime();
        const now = new Date().getTime();
        const diffMs = endTime - now;

        if (diffMs <= 0) {
            setTimeRemaining("Expired");
            return;
        }

        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs / 60000) % 60);
        const seconds = Math.floor((diffMs / 1000) % 60);

        setTimeRemaining(
            `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}`
        );
    };

    const checkIfExpired = (availableUntil) => {
        const endTime = new Date(availableUntil).getTime();
        const now = new Date().getTime();
        setIsExpired(now >= endTime);
    };

    const nextImage = () => {
        if (item && item.Images) {
            setCurrentImageIndex((prev) => (prev + 1 < imageCount ? prev + 1 : 0));
        }
    };

    const prevImage = () => {
        if (item && item.Images) {
            setCurrentImageIndex((prev) => (prev - 1 >= 0 ? prev - 1 : imageCount - 1));
        }
    };

    // bidding
    const handleBidChange = (e) => {
        setBidAmount(e.target.value);
    };
    const handlePlaceBid = async () => {
        // if (user.Setup_intent_ID === null || user.Setup_intent_ID === undefined) {
        //     console.log("user? = ", user.User_id);
        //     console.log("user = ", user.user_id);
        //     console.log("setup intent = ", user.Setup_intent_ID);
        //     console.log("Payment_method_ID = ", user.Payment_method_ID);
        //     console.log("customer = ", user.Customer_ID);
        //     alert("Please set up your payment method before placing a bid.");
        //     navigate("/accountsummary");
        //     return;
        // }
        console.log("bid placed = ", bidAmount);
        console.log("The current minimum price is = ", item.Min_price);
        console.log("The current bid is = ", item.Current_bid);
        console.log("The current item is = ", item_id);
        console.log("The current user is = ", user.user_id);
        // checks that bid amount is valid and also more than minimum/current bid

        if (!bidAmount || parseFloat(bidAmount) <= 0) {
            alert("Please enter a valid bid amount.");
            return;
        } else if (parseFloat(bidAmount) < item.Min_price) {
            alert("Bid amount must be higher than the minimum price.");
            return;
        } else if (parseFloat(bidAmount) <= item.Current_bid) {
            alert("Bid amount must be higher than the previous bid.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/place-bid", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    Item_id: item_id,
                    Bid_amount: bidAmount,
                    User_id: user.user_id,
                }),
                credentials: "include",
            });
            const data = await response.json();
            if (response.ok) {
                alert("Bid placed successfully!");
                setItem((prev) => ({ ...prev, Current_bid: parseFloat(bidAmount) })); //?
            } else if (response.status === 402) {
                // 402 Payment Required
                alert("Please set up your payment method before placing a bid.");
                navigate("/accountsummary");
            } else {
                alert(`Failed to place bid: ${data.message}`);
            }
        } catch (error) {
            console.error("Error placing bid:", error);
        }
    };
    const manualCharge = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/charge-manual", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });
            const data = await response.json();
            if (response.ok) {
                alert("Item charged successfully!");
                //setItem((prev) => ({ ...prev, Current_bid: parseFloat(bidAmount) })); //?;
            } else {
                alert(`Failed to charge: ${data.message}`);
            }
        } catch (error) {
            console.error("Error charging:", error);
        }
    };
    if (!item) {
        return <div className="text-center py-20 text-gray-600">Loading listing...</div>;
    }
    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4 lg:px-6">
            <div className="container mx-auto bg-white shadow-lg rounded-2xl p-6 lg:p-8">
                <h1 className="text-2xl lg:text-4xl font-bold text-gray-800 mb-4">
                    {item.Listing_name}
                </h1>
                <p className="text-gray-600 mb-6 text-sm lg:text-base">
                    Seller: <span className="font-semibold">{item.Seller_username}</span>
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                    <div className="lg:col-span-2">
                        <div className="relative rounded-xl overflow-hidden bg-gray-100 h-72 sm:h-96 lg:h-[30rem]">
                            {item.Images && imageCount > 0 ? (
                                <>
                                    <img
                                        src={`data:image/jpeg;base64,${item.Images[currentImageIndex]}`}
                                        alt={`${item.Listing_name} - Image ${
                                            currentImageIndex + 1
                                        }`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-between px-4">
                                        <button
                                            onClick={prevImage}
                                            className="bg-white/80 hover:bg-gray-200 rounded-full p-3 shadow-lg"
                                        >
                                            <ChevronLeft className="h-6 w-6 text-gray-800" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="bg-white/80 hover:bg-gray-200 rounded-full p-3 shadow-lg"
                                        >
                                            <ChevronRight className="h-6 w-6 text-gray-800" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
                                        {currentImageIndex + 1} / {imageCount}
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">No images available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl lg:text-2xl font-semibold mb-6">
                            Product Description
                        </h2>
                        <p className="text-gray-700 text-sm lg:text-base">
                            {item.Description || "No description available."}
                        </p>

                        <div className="mt-8">
                            <h3 className="text-lg lg:text-xl font-medium mb-4">Listing Details</h3>
                            <ul className="space-y-2 text-sm lg:text-base">
                                <li className="text-gray-600">
                                    Time Remaining:{" "}
                                    <span className="font-medium">{timeRemaining}</span>
                                </li>
                                <li className="text-gray-600">
                                    Listed:{" "}
                                    <span className="font-medium">
                                        {item.Upload_datetime || "N/A"}
                                    </span>
                                </li>

                                <li className="text-gray-600">
                                    Proposed Price:{" "}
                                    <span className="font-medium">£{item.Min_price || "0.00"}</span>
                                </li>
                                <li className="text-gray-600">
                                    Current Bid:{" "}
                                    <span className="font-medium">
                                        £{item.Current_bid || "0.00"}
                                    </span>
                                </li>

                                {user && user.level_of_access === 1 && (
                                    <li className="text-gray-600">
                                        <span
                                            className={`cursor-pointer text-2xl p-2 ${
                                                wishlist ? "text-red-600" : "text-gray-500"
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggle_wishlist(item.Item_id);
                                            }}
                                        >
                                            ♥
                                        </span>
                                    </li>
                                )}
                            </ul>

                            <div className="mt-10">
                                {user ? (
                                    user.level_of_access === 1 ? (
                                        <button className="bg-blue-600 text-white py-3 px-6 rounded-lg text-base lg:text-lg hover:bg-blue-700 transition-all">
                                            Place a Bid
                                        </button>
                                    ) : (
                                        <></>
                                    )
                                ) : (
                                    <button
                                        onClick={() => navigate(`/`)}
                                        className="bg-blue-600 text-white py-3 px-6 rounded-lg text-base lg:text-lg hover:bg-blue-700 transition-all"
                                    >
                                        Login or Signup to place a Bid
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bidding Section */}

                <div className="mt-8 text-center">
                    <div className="mb-4">
                        <label htmlFor="bid-amount-input" className="block text-lg font-semibold">
                            Place a Bid:{" "}
                        </label>
                        <input
                            id="bid-amount-input"
                            type="number"
                            placeholder="Enter your bid amount"
                            //value={parseFloat(item.Min_price) + 0.01}
                            onChange={handleBidChange}
                            //className="w-48 py-2 px-4 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                            //min={parseFloat(item.Min_price) + 0.01}
                        />
                    </div>
                    {!isExpired ? (
                        <button
                            onClick={handlePlaceBid}
                            className="bg-blue-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-blue-700 transition"
                        >
                            Place a Bid
                        </button>
                    ) : (
                        <button className="bg-blue-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-blue-700 transition ml-4">
                            Auction Expired
                        </button>
                    )}
                </div>
            </div>

            {user &&
                user.level_of_access === 1 &&
                sellerListings?.filter((listing) => listing.Item_id !== item.Item_id).length >
                    0 && (
                    <div className="container mx-auto bg-white shadow-lg rounded-2xl p-6 lg:p-8 mt-12">
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6">
                            Other Products by {item.Seller_username}
                        </h1>

                        <div
                            id="scrollContainer"
                            className="flex overflow-x-auto space-x-6 p-2 scroll-smooth"
                        >
                            {sellerListings
                                .filter(
                                    (listing) =>
                                        listing.Item_id !== item.Item_id &&
                                        listing.Authentication_request !== null &&
                                        listing.Authentication_request_approved !== false
                                )
                                .map((listing) => (
                                    <div
                                        key={listing.Item_id}
                                        className="min-w-[60%] sm:min-w-[30%] lg:min-w-[20%]"
                                    >
                                        <Listing_item item={listing} />
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
        </div>
    );
};

export default EnlargedListingPage;
