import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatWindow from "./chatwindow";
import config from "../../config";

const EnlargedAuthRequest = () => {
    const { csrfToken } = useCSRF();
    const navigate = useNavigate();
    const { user } = useUser();
    const { api_base_url } = config;

    // Gets parameters off of url
    const params = useParams();
    const item_id = params.Item_id;

    // Variables to store item and image data
    const [item, set_item] = useState(null);
    const [current_image_index, set_current_image_index] = useState(0);
    const [image_count, set_image_count] = useState(null);

    // Success and error messages
    const [errors, setErrors] = useState({});
    const [success_message, set_success_message] = useState("");

    // Chat window state
    const [is_chat_closed, set_is_chat_closed] = useState(false);

    const get_listing_information = async () => {
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
        if (item) {
            if (item.Approved === true || item.Approved === false) {
                set_is_chat_closed(true);
            }
        }
    }, []);

    // Updating auth request - approve or deny
    const handle_update = async (action) => {
        const response = await fetch(`${api_base_url}/api/update_auth_request`, {
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
            set_success_message("Successfully " + action + "ed Authentication Request");
            // Reload item data
            set_item(null);
            get_listing_information();

            // Close the chat and set chat as closed
            set_is_chat_closed(true);
        } else {
            setErrors({
                general: ["Unexpected Error. Please Try Again."],
            });
        }
    };

    const handle_second_opinion = async () => {
        const response = await fetch(`${api_base_url}/api/request-second-opinion`, {
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
            set_success_message("Successfully Asked for Second Opinion");
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
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-lg text-gray-600">Loading...</p>
            </div>
        );
    }

    // Only corresponding user can view their own listing
    if (user?.level_of_access == 1) {
        if (item.Seller_id != user?.user_id) {
            navigate("/invalid-access-rights");
            return null;
        }
    }

    // Only corresponding expert can view their assigned auth request
    if (user?.level_of_access == 2) {
        if (item.Expert_id != user?.user_id) {
            navigate("/invalid-access-rights");
            return null;
        }
    }

    // Manager can't view auth request
    if (user?.level_of_access == 3) {
        navigate("/invalid-access-rights");
        return null;
    }

    // Determine chat participants based on user role
    let senderId = user?.user_id;
    let recipientId;

    if (item.Seller_id == senderId) {
        recipientId = item.Expert_id;
    } else {
        recipientId = item.Seller_id;
    }

    return (
        <div
            className="min-h-screen px-4 py-12 bg-gray-100"
            role="main"
            aria-label="Item Details Page"
        >
            <div className="container p-6 mx-auto bg-white rounded-lg shadow-lg" aria-live="polite">
                {success_message && (
                    <div
                        className="px-4 py-3 mb-6 text-green-700 bg-green-100 border border-green-400 rounded"
                        role="alert"
                        aria-live="assertive"
                    >
                        {success_message}
                    </div>
                )}

                {errors.general && (
                    <div
                        className="px-4 py-3 mb-6 text-red-700 bg-red-100 border border-red-400 rounded"
                        role="alert"
                        aria-live="assertive"
                    >
                        {errors.general.map((error, index) => (
                            <p key={index}>{error}</p>
                        ))}
                    </div>
                )}

                {/* Title and Authentication Status */}
                <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <h1
                            className="mb-2 text-3xl font-bold text-gray-800"
                            aria-label={`Listing: ${item.Listing_name}`}
                        >
                            {item.Listing_name}
                        </h1>
                        <p
                            className="mb-1 text-gray-600"
                            aria-label={`Seller Username: ${item.Seller_username}`}
                        >
                            Seller: {item.Seller_username}
                        </p>
                        <p
                            className="text-gray-600"
                            aria-label={`Seller Name: ${item.Seller_name}`}
                        >
                            Username: {item.Seller_name}
                        </p>
                    </div>

                    <div className="md:col-span-1">
                        {((user.level_of_access === 2 && item.Approved !== null) ||
                            user.level_of_access === 1) && (
                                <div>
                                    <h2
                                        className="mb-4 text-2xl font-semibold"
                                        id="authentication-status-heading"
                                    >
                                        Authentication Status
                                    </h2>
                                    <div
                                        className={`w-full text-white py-3 px-4 rounded-lg font-medium text-center ${getAuthStatusColor()}`}
                                        role="status"
                                        aria-labelledby="authentication-status-heading"
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
                            <h2
                                className="mb-4 text-2xl font-semibold"
                                id="authentication-actions-heading"
                            >
                                Authentication Actions
                            </h2>
                            <div
                                className="grid grid-cols-1 gap-4 md:grid-cols-3"
                                role="group"
                                aria-labelledby="authentication-actions-heading"
                            >
                                <button
                                    className="px-4 py-3 font-medium text-white transition duration-300 bg-green-600 rounded-lg hover:bg-green-700"
                                    onClick={() => handle_update("accept")}
                                    aria-label="Approve Authentication"
                                >
                                    Approve Authentication
                                </button>

                                <button
                                    className="px-4 py-3 font-medium text-white transition duration-300 bg-red-600 rounded-lg hover:bg-red-700"
                                    onClick={() => handle_update("declin")}
                                    aria-label="Decline Authentication"
                                >
                                    Decline Authentication
                                </button>

                                {!item.Second_opinion && (
                                    <button
                                        className="px-4 py-3 font-medium text-white transition duration-300 bg-blue-600 rounded-lg hover:bg-blue-700"
                                        onClick={handle_second_opinion}
                                        aria-label="Request Second Opinion"
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
                    <div
                        className="relative mb-8 overflow-hidden bg-gray-100 rounded-lg h-96"
                        role="region"
                        aria-label="Product Image Gallery"
                    >
                        {item.Images && image_count > 0 ? (
                            <>
                                <img
                                    src={`data:image/jpeg;base64,${item.Images[current_image_index]}`}
                                    alt={`${item.Listing_name} - Image ${current_image_index + 1}`}
                                    className="object-contain w-full h-full"
                                    aria-describedby="image-navigation"
                                />

                                {/* Image Navigation */}
                                <div
                                    className="absolute inset-0 flex items-center justify-between p-4"
                                    id="image-navigation"
                                >
                                    <button
                                        onClick={prevImage}
                                        className="p-2 rounded-full shadow-md bg-white/80 hover:bg-gray-200"
                                        aria-label="Previous Image"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="p-2 rounded-full shadow-md bg-white/80 hover:bg-gray-200"
                                        aria-label="Next Image"
                                    >
                                        <ChevronRight className="w-6 h-6 text-gray-800" />
                                    </button>
                                </div>

                                {/* Image Counter */}
                                <div
                                    className="absolute px-3 py-1 text-sm text-white rounded-full bottom-4 right-4 bg-black/70"
                                    aria-live="polite"
                                    aria-label={`Image ${current_image_index + 1
                                        } of ${image_count}`}
                                >
                                    {current_image_index + 1} / {image_count}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full" role="alert">
                                <p className="text-gray-500">No images available</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <h2
                            className="mb-4 text-2xl font-semibold"
                            id="product-description-heading"
                        >
                            Product Description
                        </h2>
                        <p className="text-gray-700" aria-labelledby="product-description-heading">
                            {item.Description || "No description available."}
                        </p>

                        <div className="mt-6">
                            <h3 className="mb-2 text-lg font-medium" id="listing-details-heading">
                                Listing Details
                            </h3>
                            <ul className="space-y-2" aria-labelledby="listing-details-heading">
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
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Chat window */}
                <div className="w-full">
                    <h2 className="mb-4 text-2xl font-semibold" id="communication-heading">
                        Communication
                    </h2>
                    {item && senderId && recipientId && (
                        <ChatWindow
                            senderId={senderId}
                            recipientId={recipientId}
                            itemId={item.Item_id}
                            is_chat_closed={is_chat_closed}
                            aria-labelledby="communication-heading"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnlargedAuthRequest;
