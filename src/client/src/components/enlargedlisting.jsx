import React, { useState, useEffect } from "react";
import { useCSRF } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const EnlargedListingPage = () => {
    const { csrfToken } = useCSRF();
    const params = useParams();
    const item_id = params.Item_id;

    const [item, setItem] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageCount, setImageCount] = useState(0);

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
                                <li className="text-gray-600">Proposed Price: <span className="font-medium">${item.Min_price || "0.00"}</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-8 text-center">
                    <button className="bg-blue-600 text-white py-2 px-6 rounded-lg text-lg hover:bg-blue-700 transition">
                        Place a Bid
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnlargedListingPage;
