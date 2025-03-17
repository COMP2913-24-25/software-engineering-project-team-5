import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Listing_item from "../components/listing_items";

const EnlargedListingPage = () => {
    const { csrfToken } = useCSRF();
    const params = useParams();
    const navigate = useNavigate();
    const item_id = params.Item_id;
    const { user } = useUser();
    const [sellerListings, setSellerListings] = useState([]);

    const [item, setItem] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageCount, setImageCount] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState("");

    useEffect(() => {
        const fetchListingInformation = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/get-seller's-listings", {
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

        fetchListingInformation();
    }, [item_id, csrfToken]);

    useEffect(() => {
        if (item?.Available_until) {
            const interval = setInterval(() => {
                updateTimeRemaining(item.Available_until);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [item]);

    useEffect(() => {
        const fetchSellerListings = async () => {
            if (!item?.Seller_id) return; // Ensure item is loaded before fetching

            try {
                const response = await fetch("http://localhost:5000/api/get-seller-listings", {
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

                    if (response.ok && Array.isArray(data.Listings)) {
                        setSellerListings(data.Listings)
                        console.log(sellerListings)
                    } else {
                        console.warn("Seller listings is not an array!", data);
                        setSellerListings([]);
                    }

                } else {
                    console.error("Error fetching seller listings:", data);
                }
            } catch (error) {
                console.error("Request failed:", error);
            }
        };

        if (item && user) {
            fetchSellerListings();
        }
    }, [item, user, csrfToken]);


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

        setTimeRemaining(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
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

    if (!item) {
        return <div className="text-center py-20 text-gray-600">Loading listing...</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen py-12 px-4">
            <div className="container mx-auto bg-white shadow-lg rounded-lg p-6 mt-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{item.Listing_name}</h1>
                <p className="text-gray-600 mb-4">Seller: {item.Seller_username}</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="relative rounded-lg overflow-hidden bg-gray-100 h-96">
                            {item.Images && imageCount > 0 ? (
                                <>
                                    <img
                                        src={`data:image/jpeg;base64,${item.Images[currentImageIndex]}`}
                                        alt={`${item.Listing_name} - Image ${currentImageIndex + 1}`}
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-between p-4">
                                        <button
                                            onClick={prevImage}
                                            className="bg-white/80 hover:bg-gray-200 rounded-full p-2 shadow-md"
                                        >
                                            <ChevronLeft className="h-6 w-6 text-gray-800" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="bg-white/80 hover:bg-gray-200 rounded-full p-2 shadow-md"
                                        >
                                            <ChevronRight className="h-6 w-6 text-gray-800" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
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
                        <h2 className="text-xl font-semibold mb-4">Product Description</h2>
                        <p className="text-gray-700">{item.Description || "No description available."}</p>
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">Listing Details</h3>
                            <ul className="space-y-2">
                                <li className="text-gray-600">Time Remaining: <span className="font-medium">{timeRemaining}</span></li>
                                <li className="text-gray-600">Listed: <span className="font-medium">{item.Upload_datetime || "N/A"}</span></li>
                                <li className="text-gray-600">Proposed Price: <span className="font-medium">${item.Min_price || "0.00"}</span></li>
                            </ul>
                            <div className="mt-8 text-left">
                                {user ? (

                                    <button className="bg-blue-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-blue-700 transition">
                                        Place a Bid
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/`)} // Call navigate when the button is clicked
                                        className="bg-blue-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-blue-700 transition"
                                    >
                                        Login or Signup to place a Bid
                                    </button>

                                )}

                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {user && user.level_of_access === 1 && sellerListings.length > 0 && (
                <div className="container mx-auto bg-white shadow-lg rounded-lg p-6 mt-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Other Products by {item.Seller_username}
                    </h1>

                    <div id="scrollContainer" className="flex overflow-x-auto space-x-4 p-2 scroll-smooth">
                        {sellerListings
                            .filter((listing) => listing.Item_id !== item.Item_id) // Exclude current item
                            .map((listing, index) => (
                                <div key={index} className="min-w-[40%] sm:min-w-0 sm:w-auto">
                                    <Listing_item item={listing} />
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

        </div>
    );
};

export default EnlargedListingPage;
