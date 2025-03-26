import React, { useState, useEffect } from "react";

import { useUser, useCSRF } from "../App"; // changed to include useUser
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Listing_item from "../components/listing_items";
import config from "../../config";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const EnlargedListingPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const { csrfToken } = useCSRF();
    const { api_base_url } = config;

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
            }
        } catch (error) {
            alert("An error occurred while checking the watchlist.");
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
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert("An error occurred while updating the watchlist.");
        }
    };

    const fetchListingInformation = async () => {
        try {
            const response = await fetch(`${api_base_url}/api/get-single-listing`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({ Item_id: item_id }),
                credentials: "include",
            });
            const data = await response.json();

            if (response.ok) {
                setItem(data);
                setImageCount(data.Images.length);
                if (data.Available_until) {
                    updateTimeRemaining(data.Available_until);
                }
            }
        } catch (error) {}
    };

    const fetchSellerListings = async () => {
        if (!item?.Seller_id) return; // Ensure item is loaded before fetching
        setSellerListings([]);
        try {
            const response = await fetch(`${api_base_url}/api/get-seller-items`, {
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
                if (response.ok) {
                    setSellerListings(data);
                } else {
                    setSellerListings();
                }
            }
        } catch (error) {}
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
    }, [item?.Available_until]);

    useEffect(() => {
        if (user && item) {
            check_watchlist();
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
            const response = await fetch(`${api_base_url}/api/place-bid`, {
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
        } catch (error) {}
    };

    const manualCharge = async () => {
        try {
            const response = await fetch(`${api_base_url}/api/charge-manual`, {
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
        } catch (error) {}
    };

    if (!item) {
        return <div className="py-20 text-center text-gray-600">Loading listing...</div>;
    }

    return (
        <div className="min-h-screen px-4 py-8 bg-gray-50 lg:px-6" role="main">
            <div className="container p-6 mx-auto bg-white shadow-lg rounded-2xl lg:p-8">
                <h1
                    className="mb-4 text-2xl font-bold text-gray-800 lg:text-4xl"
                    id="product-title"
                >
                    {item.Listing_name}
                </h1>
                <p className="mb-6 text-sm text-gray-600 lg:text-base">
                    Seller: <span className="font-semibold">{item.Seller_username}</span>
                </p>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-10">
                    <div className="lg:col-span-2">
                        <div
                            className="relative rounded-xl overflow-hidden bg-gray-100 h-[30rem] flex items-center justify-center"
                            aria-labelledby="product-title"
                            role="region"
                            aria-label="Product images"
                        >
                            {item.Images && imageCount > 0 ? (
                                <>
                                    <LazyLoadImage
                                        src={`data:image/jpeg;base64,${item.Images[currentImageIndex]}`}
                                        alt={`${item.Listing_name} - Image ${
                                            currentImageIndex + 1
                                        } of ${imageCount}`}
                                        effect="blur"
                                        className="object-contain w-full max-h-[30rem]"
                                    />
                                    <div
                                        className="absolute inset-0 flex items-center justify-between px-4"
                                        role="navigation"
                                        aria-label="Image navigation"
                                    >
                                        <button
                                            onClick={prevImage}
                                            className="p-3 rounded-full shadow-lg bg-white/80 hover:bg-gray-200"
                                            aria-label="Previous image"
                                            disabled={currentImageIndex === 0}
                                        >
                                            <ChevronLeft
                                                className="w-6 h-6 text-gray-800"
                                                aria-hidden="true"
                                            />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="p-3 rounded-full shadow-lg bg-white/80 hover:bg-gray-200"
                                            aria-label="Next image"
                                            disabled={currentImageIndex === imageCount - 1}
                                        >
                                            <ChevronRight
                                                className="w-6 h-6 text-gray-800"
                                                aria-hidden="true"
                                            />
                                        </button>
                                    </div>
                                    <div
                                        className="absolute px-4 py-2 text-sm text-white rounded-lg bottom-4 right-4 bg-black/60"
                                        aria-live="polite"
                                    >
                                        <span
                                            aria-label={`Image ${
                                                currentImageIndex + 1
                                            } of ${imageCount}`}
                                        >
                                            {currentImageIndex + 1} / {imageCount}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div
                                    className="flex items-center justify-center h-full"
                                    role="status"
                                >
                                    <p className="text-gray-500">No images available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <section aria-labelledby="description-heading">
                            <h2
                                className="mb-6 text-xl font-semibold lg:text-2xl"
                                id="description-heading"
                            >
                                Product Description
                            </h2>
                            <p className="text-sm text-gray-700 lg:text-base">
                                {item.Description || "No description available."}
                            </p>
                        </section>

                        <section className="mt-8" aria-labelledby="details-heading">
                            <h3
                                className="mb-4 text-lg font-medium lg:text-xl"
                                id="details-heading"
                            >
                                Listing Details
                            </h3>
                            <ul
                                className="space-y-2 text-sm lg:text-base"
                                aria-label="Product details list"
                            >
                                <li className="text-gray-600">
                                    <span id="time-remaining-label">Time Remaining:</span>{" "}
                                    <span
                                        className="font-medium"
                                        aria-labelledby="time-remaining-label"
                                    >
                                        {timeRemaining}
                                    </span>
                                </li>
                                <li className="text-gray-600">
                                    <span id="listed-date-label">Listed:</span>{" "}
                                    <span
                                        className="font-medium"
                                        aria-labelledby="listed-date-label"
                                    >
                                        {item.Upload_datetime || "N/A"}
                                    </span>
                                </li>

                                <li className="text-gray-600">
                                    <span id="proposed-price-label">Proposed Price:</span>{" "}
                                    <span
                                        className="font-medium"
                                        aria-labelledby="proposed-price-label"
                                    >
                                        £{item.Min_price || "0.00"}
                                    </span>
                                </li>
                                <li className="text-gray-600">
                                    <span id="current-bid-label">Current Bid:</span>{" "}
                                    <span
                                        className="font-medium"
                                        aria-labelledby="current-bid-label"
                                    >
                                        £{item.Current_bid || "0.00"}
                                    </span>
                                </li>
                                {item.Tags && item.Tags.length > 0 ? (
                                    <ul className="flex space-x-2">
                                        {item.Tags.map((tag, index) => (
                                            <li
                                                key={index}
                                                className="px-3 py-1 text-sm text-white bg-gray-600 rounded-full"
                                            >
                                                {tag}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <li></li>
                                )}
                                {user && user.level_of_access === 1 && (
                                    <li className="text-gray-600">
                                        <button
                                            className={`cursor-pointer text-2xl p-2 ${
                                                wishlist ? "text-red-600" : "text-gray-500"
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggle_wishlist(item.Item_id);
                                            }}
                                            aria-label={
                                                wishlist
                                                    ? "Remove from wishlist"
                                                    : "Add to wishlist"
                                            }
                                            aria-pressed={wishlist}
                                        >
                                            ♥
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </section>
                    </div>
                </div>

                {/* Bidding Section */}
                <section className="mt-8 text-center" aria-labelledby="bidding-section">
                    <h2 id="bidding-section" className="sr-only">
                        Bidding Section
                    </h2>
                    <div className="mt-8 text-center">

                        {user & user?.level_of_access === 1 & user?.user_id !== item.Seller_id ? ( // if user, user isn't manager/expert, and user isn't seller
                            <>
                                <div className="mb-4">
                                    <label
                                        htmlFor="bid-amount-input"
                                        className="block text-lg font-semibold"
                                    >
                                        Place a Bid:{" "}
                                    </label>
                                    <input
                                        id="bid-amount-input"
                                        type="number"
                                        placeholder="Enter your bid amount"
                                        onChange={handleBidChange}
                                        className="px-4 py-2 border border-gray-300 rounded-lg"
                                        aria-label="Bid amount"
                                        aria-describedby="bid-instructions"
                                    />
                                    <div id="bid-instructions" className="sr-only">
                                        Enter your bid amount. Must be higher than the minimum price
                                        and the current bid.
                                    </div>
                                </div>
                                {!isExpired ? (
                                    <button
                                        onClick={handlePlaceBid}
                                        className="px-6 py-2 text-lg text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
                                        aria-label="Submit your bid"
                                    >
                                        Place a Bid
                                    </button>
                                ) : (
                                    <button
                                        className="px-6 py-2 ml-4 text-lg text-white transition bg-blue-600 rounded-lg hover:bg-blue-700"
                                        aria-label="Auction has expired, bidding no longer available"
                                    >
                                        Auction Expired
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={() => navigate(`/signup`)}
                                className="px-6 py-3 text-base text-white transition-all bg-blue-600 rounded-lg lg:text-lg hover:bg-blue-700"
                            >
                                Login or Signup to place a Bid
                            </button>
                        )}
                    </div>
                </section>
            </div>

            {user &&
                user.level_of_access === 1 &&
                sellerListings?.filter((listing) => listing.Item_id !== item.Item_id).length >
                    0 && (
                    <section
                        className="container p-6 mx-auto mt-12 bg-white shadow-lg rounded-2xl lg:p-8"
                        aria-labelledby="other-products-heading"
                    >
                        <h2
                            className="mb-6 text-2xl font-bold text-gray-800 lg:text-3xl"
                            id="other-products-heading"
                        >
                            Other Products by {item.Seller_username}
                        </h2>

                        <div
                            id="scrollContainer"
                            className="flex p-2 space-x-6 overflow-x-auto scroll-smooth"
                            role="region"
                            aria-label="Scrollable list of other products by this seller"
                            tabIndex="0"
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
                    </section>
                )}
        </div>
    );
};

export default EnlargedListingPage;
