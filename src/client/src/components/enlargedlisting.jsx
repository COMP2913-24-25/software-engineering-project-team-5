import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App"; // changed to include useUser
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const EnlargedListingPage = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const { csrfToken } = useCSRF();
    const params = useParams();
    const item_id = params.Item_id;

    const [item, setItem] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageCount, setImageCount] = useState(0);
    
    // for bidding
    const [bidAmount, setBidAmount] = useState(0);

    useEffect(() => {
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
                if (response.ok) {
                    setItem(data);
                    setImageCount(data.Images.length);
                }
            } catch (error) {
                console.error("Error fetching listing information:", error);
            }
        };
        fetchListingInformation();
    }, [item_id, csrfToken]);

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
        console.log("The current user is = ", user.user_id );
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
                body: JSON.stringify({ Item_id: item_id, Bid_amount: bidAmount, User_id: user.user_id }),
                credentials: "include",
            });
            const data = await response.json();
            if (response.ok) {
                alert("Bid placed successfully!");
                setItem((prev) => ({ ...prev, Current_bid: parseFloat(bidAmount) })); //?
            } else if (response.status === 402) { // 402 Payment Required
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
        <div className="bg-gray-100 min-h-screen py-12 px-4">
            <div className="container mx-auto bg-white shadow-lg rounded-lg p-6">
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
                                <li className="text-gray-600">Listed: <span className="font-medium">{item.Upload_datetime || "N/A"}</span></li>
                                <li className="text-gray-600">Auction ends: <span className="font-medium">{item.Available_until || "N/A"}</span></li>
                                <li className="text-gray-600">Proposed Price: <span className="font-medium">£{item.Min_price || "0.00"}</span></li>
                                <li className="text-gray-600">Current bid: <span className="font-medium">£{item.Current_bid || "0.00"}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bidding Section */}

                <div className="mt-8 text-center">
                    <div className="mb-4">
                        <label htmlFor="bid-amount-input" className="block text-lg font-semibold">Place a Bid: </label>
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
                    <button onClick={handlePlaceBid} className="bg-blue-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-blue-700 transition">
                        Place a Bid
                    </button>
                    <button onClick={manualCharge} className="bg-blue-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-blue-700 transition ml-4">
                        Charge Manually
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnlargedListingPage;
