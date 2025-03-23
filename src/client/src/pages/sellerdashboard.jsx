import React, { useState, useEffect } from "react";
import "../App.css";
import { useUser, useCSRF } from "../App";
import { useNavigate } from "react-router-dom";
import Listing_item from "../components/listing_items";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SellerDashboard = () => {
    const { user } = useUser();
    const { csrfToken } = useCSRF();
    const navigate = useNavigate();

    const [authPendingItems, setAuthPendingItems] = useState([]);
    const [underReviewItems, setUnderReviewItems] = useState([]);
    const [normalItems, setNormalItems] = useState([]);
    const [rejectedItems, setRejectedItems] = useState([]);

    const itemsPerPage = 4;

    const [authPendingIndex, setAuthPendingIndex] = useState(0);
    const [underReviewIndex, setUnderReviewIndex] = useState(0);
    const [normalIndex, setNormalIndex] = useState(0);
    const [rejectedIndex, setRejectedIndex] = useState(0);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/get-sellerss-items", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    credentials: "include",
                });

                const data = await response.json();
                if (response.ok) {
                    const authReqItems = data.filter(
                        (item) => item.Authentication_request === true
                    );
                    const noAuthReqItems = data.filter(
                        (item) => item.Authentication_request === false
                    );
                    
                    setAuthPendingItems(authReqItems.filter((item) => item.Expert_id === null));
                    setUnderReviewItems(authReqItems.filter((item) => item.Expert_id !== null));
                    setRejectedItems(
                        noAuthReqItems.filter(
                            (item) =>
                                item.Verified === false &&
                                item.Authentication_request_approved === false
                        )
                    );
                    setNormalItems(
                        noAuthReqItems.filter(
                            (item) =>
                                (item.Authentication_request === false &&
                                    item.Verified === true &&
                                    item.Authentication_request_approved === true) ||
                                (item.Authentication_request === false &&
                                    item.Verified === false &&
                                    item.Authentication_request_approved === null)
                        )
                    );
                } else {
                    console.error("Failed to get the listings");
                }
            } catch (error) {
                console.error("Network error: ", error);
            }
        };

        if (user?.level_of_access === 1) {
            fetchItems();
        } else {
            navigate("/invalid-access-rights");
        }

        fetchItems();
    },[navigate, user]);

    const nextPage = (indexSetter, items) => {
        indexSetter((prev) => (prev + itemsPerPage < items.length ? prev + itemsPerPage : prev));
    };

    const prevPage = (indexSetter) => {
        indexSetter((prev) => (prev - itemsPerPage >= 0 ? prev - itemsPerPage : prev));
    };

    const renderItemsSection = (title, items, index, setIndex) => (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" id={title.replace(/\s+/g, "-").toLowerCase()}>
                {title}
            </h2>
            {items.length === 0 ? (
                <p className="text-gray-500">No items available.</p>
            ) : (
                <div className="flex items-center gap-4" role="region" aria-labelledby={title.replace(/\s+/g, "-").toLowerCase()}>
                    <button 
                        onClick={() => prevPage(setIndex)} 
                        aria-label={`Previous page of ${title}`} 
                        disabled={index === 0}
                    >
                        <ChevronLeft />
                    </button>
                    <div className="grid grid-cols-4 gap-4">
                        {items.slice(index, index + itemsPerPage).map((item) => (
                            <Listing_item key={item.Item_id} item={item} />
                        ))}
                    </div>
                    <button 
                        onClick={() => nextPage(setIndex, items)} 
                        aria-label={`Next page of ${title}`} 
                        disabled={index + itemsPerPage >= items.length}
                    >
                        <ChevronRight />
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Seller Dashboard
                </h1>
                <p className="text-xl text-gray-500 mt-2">Create and manage your listings.</p>
            </div>

            {renderItemsSection("Currently Listed Items", normalItems, normalIndex, setNormalIndex)}

            {renderItemsSection("Authentication Pending", authPendingItems, authPendingIndex, setAuthPendingIndex)}

            {renderItemsSection("Under Review", underReviewItems, underReviewIndex, setUnderReviewIndex)}

            {renderItemsSection("Authentication Rejected", rejectedItems, rejectedIndex, setRejectedIndex)}
        </div>
    );
};

export default SellerDashboard;
