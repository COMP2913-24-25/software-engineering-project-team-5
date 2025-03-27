import React, { useState, useEffect } from "react";
import "../App.css";
import { useUser, useCSRF } from "../App";
import { useNavigate } from "react-router-dom";
import Listing_item from "../components/listing_items";
import { ChevronLeft, ChevronRight } from "lucide-react";
import config from "../../config";

const SellerDashboard = () => {
    const { user } = useUser();
    const { csrfToken } = useCSRF();
    const navigate = useNavigate();
    const { api_base_url } = config;

    const [authPendingItems, setAuthPendingItems] = useState([]);
    const [underReviewItems, setUnderReviewItems] = useState([]);
    const [normalItems, setNormalItems] = useState([]);
    const [rejectedItems, setRejectedItems] = useState([]);
    const [expiredNoBidsItems, setExpiredNoBidsItems] = useState([]);
    const [expiredSoldItems, setExpiredSoldItems] = useState([]);

    const itemsPerPage = 4;

    const [authPendingIndex, setAuthPendingIndex] = useState(0);
    const [underReviewIndex, setUnderReviewIndex] = useState(0);
    const [normalIndex, setNormalIndex] = useState(0);
    const [rejectedIndex, setRejectedIndex] = useState(0);
    const [expiredNoBidsIndex, setExpiredNoBidsIndex] = useState(0);
    const [expiredSoldIndex, setExpiredSoldIndex] = useState(0);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch(`${api_base_url}/api/get-sellerss-items`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    credentials: "include",
                });

                const data = await response.json();
                if (response.ok) {
                    const now = new Date();

                    const expiredItems = data.filter(
                        (item) => new Date(item.Available_until) < now
                    );
                    const activeItems = data.filter(
                        (item) => new Date(item.Available_until) >= now
                    );

                    const authReqItems = activeItems.filter(
                        (item) => item.Authentication_request === true
                    );
                    const noAuthReqItems = activeItems.filter(
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

                    setExpiredNoBidsItems(expiredItems.filter((item) => item.Sold === false));
                    setExpiredSoldItems(expiredItems.filter((item) => item.Sold === true));
                }
            } catch (error) {
                console.error("Error fetching items:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.level_of_access === 1) {
            fetchItems();
        } else {
            navigate("/invalid-access-rights");
        }
    }, [navigate, user, csrfToken]);

    const nextPage = (indexSetter, items) => {
        indexSetter((prev) => (prev + itemsPerPage < items.length ? prev + itemsPerPage : prev));
    };

    const prevPage = (indexSetter) => {
        indexSetter((prev) => (prev - itemsPerPage >= 0 ? prev - itemsPerPage : prev));
    };

    const renderItemsSection = (title, items, index, setIndex) => (
        <div className="mb-8">
            <h2
                className="mb-4 text-xl font-semibold"
                id={title.replace(/\s+/g, "-").toLowerCase()}
            >
                {title}
            </h2>
            {items.length === 0 && title !== "Currently Listed Items" ? (
                <p className="text-gray-500">No items available.</p>
            ) : (
                <div
                    className="flex items-center gap-4"
                    role="region"
                    aria-labelledby={title.replace(/\s+/g, "-").toLowerCase()}
                >
                    <button
                        onClick={() => prevPage(setIndex)}
                        aria-label={`Previous page of ${title}`}
                        disabled={index === 0}
                        className="disabled:opacity-50"
                    >
                        <ChevronLeft />
                    </button>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {title === "Currently Listed Items" && (
                            <div
                                className="w-full max-w-[300px] h-[286px] border border-gray-300 rounded-lg overflow-hidden bg-gray-100 transition-transform transform hover:scale-105 cursor-pointer flex flex-col items-center justify-center"
                                onClick={() => navigate("/create-listing")}
                            >
                                <div className="relative flex items-center justify-center w-full h-full overflow-hidden bg-gray-200">
                                    <span className="text-4xl text-gray-600">+</span>
                                </div>
                                <div className="w-full p-4 font-sans text-center">
                                    <span className="font-bold text-blue-600 hover:underline">
                                        Create New Listing
                                    </span>
                                </div>
                            </div>
                        )}
                        {items.slice(index, index + itemsPerPage).map((item) => (
                            <Listing_item
                                key={item.Item_id}
                                item={item}
                                isExpired={title.includes("Expired")}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => nextPage(setIndex, items)}
                        aria-label={`Next page of ${title}`}
                        disabled={index + itemsPerPage >= items.length}
                        className="disabled:opacity-50"
                    >
                        <ChevronRight />
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="mb-8 text-center">
                <h1 className="mb-4 text-2xl font-semibold text-center text-gray-800">
                    Seller Dashboard
                </h1>
                <p className="mt-2 text-xl text-gray-500">Create and manage your listings.</p>
            </div>

            {loading ? (
                <div className="py-20 text-center text-gray-600">
                    <div className="flex items-center justify-center">
                        <div
                            className="w-16 h-16 border-t-4 border-blue-600 border-dashed rounded-full animate-spin"
                            role="status"
                            aria-label="Loading current bids"
                        ></div>
                    </div>
                    <p>Loading listings...</p>
                </div>
            ) : (
                <>
                    {renderItemsSection(
                        "Currently Listed Items",
                        normalItems,
                        normalIndex,
                        setNormalIndex
                    )}
                    {renderItemsSection(
                        "Authentication Pending",
                        authPendingItems,
                        authPendingIndex,
                        setAuthPendingIndex
                    )}
                    {renderItemsSection(
                        "Under Review",
                        underReviewItems,
                        underReviewIndex,
                        setUnderReviewIndex
                    )}
                    {renderItemsSection(
                        "Authentication Rejected",
                        rejectedItems,
                        rejectedIndex,
                        setRejectedIndex
                    )}
                    {renderItemsSection(
                        "Expired - No Bids",
                        expiredNoBidsItems,
                        expiredNoBidsIndex,
                        setExpiredNoBidsIndex
                    )}
                    {renderItemsSection(
                        "Expired - Sold",
                        expiredSoldItems,
                        expiredSoldIndex,
                        setExpiredSoldIndex
                    )}
                </>
            )}
        </div>
    );
};

export default SellerDashboard;
