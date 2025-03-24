import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../App";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatWindow from "./chatwindow";

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
    const [success_message, set_success_message] = useState("");

    // Chat window state
    const [is_chat_closed, set_is_chat_closed] = useState(false);

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
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <p className="text-gray-600 text-lg">Loading...</p>
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
        <div role="region" aria-label="Authentication Request Details">
            {success_message && (
                <div role="alert" aria-live="polite" className="success-message">
                    {success_message}
                </div>
            )}

            {errors.general && (
                <div role="alert" aria-live="assertive" className="error-container">
                    {errors.general.map((error, index) => (
                        <p key={index}>{error}</p>
                    ))}
                </div>
            )}

            {/* Title and Authentication Status */}
            <div className="listing-header">
                <div className="listing-title">
                    <h1 id="listing-name">{item.Listing_name}</h1>
                    <p aria-labelledby="seller-label">
                        <span id="seller-label" className="sr-only">
                            Seller:
                        </span>{" "}
                        {item.Seller_username}
                    </p>
                    <p aria-labelledby="username-label">
                        <span id="username-label" className="sr-only">
                            Username:
                        </span>{" "}
                        {item.Seller_name}
                    </p>
                </div>

                <div className="auth-status">
                    {user.level_of_access === 2 && item.Approved !== null && (
                        <div className="status-box" aria-live="polite">
                            <h2 id="auth-status-heading">Authentication Status</h2>
                            <p aria-labelledby="auth-status-heading">{getAuthStatusText()}</p>
                        </div>
                    )}

                    {user.level_of_access === 1 && (
                        <div className="status-box" aria-live="polite">
                            <h2 id="auth-status-heading-user">Authentication Status</h2>
                            <p aria-labelledby="auth-status-heading-user">{getAuthStatusText()}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Authentication buttons */}
            <div className="auth-actions">
                {user.level_of_access === 2 && item.Approved === null && (
                    <div className="action-container">
                        <h2 id="auth-actions-heading">Authentication Actions</h2>
                        <div
                            className="button-group"
                            role="group"
                            aria-labelledby="auth-actions-heading"
                        >
                            <button
                                type="button"
                                onClick={() => handle_update("accept")}
                                aria-label="Approve authentication for this listing"
                            >
                                Approve Authentication
                            </button>
                            <button
                                type="button"
                                onClick={() => handle_update("declin")}
                                aria-label="Decline authentication for this listing"
                            >
                                Decline Authentication
                            </button>
                            {!item.Second_opinion && (
                                <button
                                    type="button"
                                    aria-label="Request a second opinion on this listing"
                                >
                                    Request Second Opinion
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Image and product description */}
            <div className="product-container">
                <div className="image-container">
                    {item.Images && image_count > 0 ? (
                        <>
                            <div aria-hidden="true">
                                {/* Image Navigation */}
                                <div
                                    className="image-navigation"
                                    role="navigation"
                                    aria-label="Product images"
                                >
                                    <button
                                        type="button"
                                        aria-label="Previous image"
                                        disabled={current_image_index === 0}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Next image"
                                        disabled={current_image_index === image_count - 1}
                                    >
                                        Next
                                    </button>
                                </div>

                                {/* Image Counter */}
                                <div className="image-counter" aria-live="polite">
                                    <span
                                        aria-label={`Image ${
                                            current_image_index + 1
                                        } of ${image_count}`}
                                    >
                                        {current_image_index + 1} / {image_count}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-images" role="status">
                            <p>No images available</p>
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div className="product-details">
                    <section>
                        <h2 id="product-description-heading">Product Description</h2>
                        <div aria-labelledby="product-description-heading">
                            {item.Description || "No description available."}
                        </div>
                    </section>

                    <section>
                        <h2 id="listing-details-heading">Listing Details</h2>
                        <dl aria-labelledby="listing-details-heading">
                            <div className="detail-item">
                                <dt>Listed:</dt>
                                <dd>{item.Upload_datetime || "N/A"}</dd>
                            </div>
                            <div className="detail-item">
                                <dt>Proposed Price:</dt>
                                <dd>${item.Min_price || "0.00"}</dd>
                            </div>
                        </dl>
                    </section>
                </div>
            </div>

            {/* Chat window */}
            <div className="communication-section" aria-labelledby="communication-heading">
                <h2 id="communication-heading">Communication</h2>
                {item && senderId && recipientId && (
                    <div role="complementary" aria-label="Chat window"></div>
                )}
            </div>
        </div>
    );
};

export default EnlargedAuthRequest;
