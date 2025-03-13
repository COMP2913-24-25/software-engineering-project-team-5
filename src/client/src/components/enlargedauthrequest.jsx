import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const EnlargedAuthRequest = () => {
    const { csrfToken } = useCSRF();
    const navigate = useNavigate();
    const { user } = useUser();

    // Gets parameters off of url
    const params = useParams();
    const item_id = params.Item_id;

    // Variables to store item and image data
    const [item, set_item] = useState(null);
    const [current_image_index, set_current_image_index] = useState(0);
    const [image_count, set_image_count] = useState(null);

    // Success and error messages
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    const get_listing_information = async () => {
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

            // Waits for server response
            const data = await response.json();

            if (response.ok) {
                // If response is ok, set variables to server data
                set_item(data);
                set_image_count(data.Images.length);
            }
        } catch (error) {
            console.error("Error fetching listing information:", error);
            setErrors({ general: ["Failed to fetch listing data"] });
        }
    };

    useEffect(() => {
        get_listing_information();
    }, []);

    // Updating auth request - approve or deny
    const handle_update = async (action) => {
        const response = await fetch("http://localhost:5000/api/update_auth_request", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify({
                request_id: item_id,
                action: action,
            }),
            credentials: "include",
        });

        // Waits for server response
        const data = await response.json();

        if (response.ok) {
            setSuccessMessage("Successfully " + action + "ed Authentication Request");
            // Reload item data
            set_item(null);
            get_listing_information();
        } else {
            setErrors({
                general: ["Unexpected Error. Please Try Again."],
            });
        }
    };

    const handle_second_opinion = async () => {
        const response = await fetch("http://localhost:5000/api/request-second-opinion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify({
                Item_id: item_id,
            }),
            credentials: "include",
        });

        // Waits for server response
        const data = await response.json();

        if (response.ok) {
            setSuccessMessage("Successfully Asked for Second Opinion");
            navigate("/expert/auth");
        } else {
            setErrors({
                general: ["Unexpected Error. Please Try Again."],
            });
        }
    };

    // Image carousel navigation
    const nextImage = () => {
        if (item && item.Images) {
            set_current_image_index((prev) => (prev + 1 < image_count ? prev + 1 : 0));
        }
    };

    const prevImage = () => {
        if (item && item.Images) {
            set_current_image_index((prev) => (prev - 1 >= 0 ? prev - 1 : image_count - 1));
        }
    };

    // Determine authentication status display text
    const getAuthStatusText = () => {
        if (item.Approved === true) {
            return "Approved";
        } else if (item.Approved === false) {
            return "Declined";
        } else {
            return "Pending";
        }
    };

    // Determine authentication status display color
    const getAuthStatusColor = () => {
        if (item.Approved === true) {
            return "bg-green-600";
        } else if (item.Approved === false) {
            return "bg-red-600";
        } else {
            return "bg-yellow-500";
        }
    };

    // Doesn't load HTML until item has been retrieved
    if (!item) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <p className="text-gray-600 text-lg">Loading...</p>
            </div>
        );
    }

    // Only corresponding user can view their own listing
    if (user?.level_of_access == 1) {
        if (item.Seller_id != user?.user_id) {
            navigate("/home-page");
            return null;
        }
    }

    // Only corresponding expert can view their assigned auth request
    if (user?.level_of_access == 2) {
        if (item.Expert_id != user?.user_id) {
            navigate("/home-page");
            return null;
        }
    }

    // Manager can't view auth request
    if (user?.level_of_access == 3) {
        navigate("/home-page");
        return null;
    }

    return (
        <div className="bg-gray-100 min-h-screen py-12 px-4">
            <div className="container mx-auto bg-white shadow-lg rounded-lg p-6">
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                        {successMessage}
                    </div>
                )}

                {errors.general && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {errors.general.map((error, index) => (
                            <p key={index}>{error}</p>
                        ))}
                    </div>
                )}

                {/* Title and Authentication Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            {item.Listing_name}
                        </h1>
                        <p className="text-gray-600 mb-1">Seller: {item.Seller_username}</p>
                        <p className="text-gray-600">Username: {item.Seller_name}</p>
                    </div>

                    <div className="md:col-span-1">
                        {user.level_of_access === 2 && item.Approved !== null && (
                            <div>
                                <h2 className="text-2xl font-semibold mb-4">
                                    Authentication Status
                                </h2>
                                <div
                                    className={`w-full text-white py-3 px-4 rounded-lg font-medium text-center ${getAuthStatusColor()}`}
                                >
                                    {getAuthStatusText()}
                                </div>
                            </div>
                        )}

                        {user.level_of_access === 1 && (
                            <div>
                                <h2 className="text-2xl font-semibold mb-4">
                                    Authentication Status
                                </h2>
                                <div
                                    className={`w-full text-white py-3 px-4 rounded-lg font-medium text-center ${getAuthStatusColor()}`}
                                >
                                    {getAuthStatusText()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Authentication buttons */}
                <div className="w-full">
                    {user.level_of_access === 2 && item.Approved === null && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold mb-4">Authentication Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 font-medium"
                                    onClick={() => handle_update("accept")}
                                >
                                    Approve Authentication
                                </button>

                                <button
                                    className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition duration-300 font-medium"
                                    onClick={() => handle_update("declin")}
                                >
                                    Decline Authentication
                                </button>

                                {!item.Second_opinion && (
                                    <button
                                        className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 font-medium"
                                        onClick={handle_second_opinion}
                                    >
                                        Request Second Opinion
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Image and product description */}
                <div className="w-full mb-8">
                    <div className="relative rounded-lg overflow-hidden bg-gray-100 h-96 mb-8">
                        {item.Images && image_count > 0 ? (
                            <>
                                <img
                                    src={`data:image/jpeg;base64,${item.Images[current_image_index]}`}
                                    alt={`${item.Listing_name} - Image ${current_image_index + 1}`}
                                    className="w-full h-full object-contain"
                                />

                                {/* Image Navigation */}
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

                                {/* Image Counter */}
                                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                    {current_image_index + 1} / {image_count}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">No images available</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Product Description</h2>
                        <p className="text-gray-700">
                            {item.Description || "No description available."}
                        </p>

                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-2">Listing Details</h3>
                            <ul className="space-y-2">
                                <li className="text-gray-600">
                                    Listed:{" "}
                                    <span className="font-medium">
                                        {item.Upload_datetime || "N/A"}
                                    </span>
                                </li>
                                <li className="text-gray-600">
                                    Proposed Price:{" "}
                                    <span className="font-medium">${item.Min_price || "0.00"}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Chat window */}
                <div className="w-full">
                    <h2 className="text-2xl font-semibold mb-4">Communication</h2>
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <div className="text-center">
                            <p className="text-gray-700 mb-4">chat to be added here</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnlargedAuthRequest;
