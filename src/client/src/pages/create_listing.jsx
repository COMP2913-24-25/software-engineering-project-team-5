import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App"; // Access the user
import { useNavigate } from "react-router-dom";
import Tag_selector from "../components/tags_dropdown";
import { Image } from "lucide-react";
import config from "../../config";

const CreateListing = () => {
    /*
    Allows a logged in user to create a listing- front end only handles simple form 
    validation, and routing to the different page upon successful login (currently
    redirects to signup page).

    Makes use of form created in forms.py so that input validation is handled server-side.
    */

    const navigate = useNavigate();
    const { api_base_url } = config;

    // Creates the user object to be accessible
    const { user } = useUser();

    const { csrfToken } = useCSRF();

    const [eFee, setEFee] = useState(5);

    const [mFee, setMFee] = useState(1);

    // Set up the data that is in the form - should match the variable names used in forms.py
    const [formData, setFormData] = useState({
        seller_id: "",
        listing_name: "",
        listing_description: "",
        minimum_price: 0,
        days_available: 0,
        authentication_request: false,
        images: [],
    });

    const [showForm, setShowForm] = useState(true);
    // Error dictionary to display errors when doing client side validation
    const [errors, setErrors] = useState({});

    const [selected_tags, set_selected_tags] = useState([]);

    useEffect(() => {
        if (user?.level_of_access === 1) {
            getProfitStructure();
            setFormData((prevData) => ({
                ...prevData,
                seller_id: user.user_id,
            }));
        } else {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    const handle_file_change = (event) => {
        const files = event.target.files;
        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...files],
        }));
    };

    // Function to update the formData as the user types in the input field
    const handleChange = (event) => {
        // Stores the name and value of the input field that is being edited
        const { name, value, type, checked } = event.target;

        // Updates the formData to reflect the new changes
        // Similar to string concatenation
        setFormData((prevData) => ({
            ...prevData, // Keep existing form data
            [name]: type === "checkbox" ? checked : value, // Adds on the new fieldValue to the end
        }));
    };

    // Client side validation
    const validateForm = () => {
        const newErrors = {};

        // Checks if listing name field is empty
        if (!formData.listing_name.trim()) {
            newErrors.listing_name = ["Listing name is required"];
        }

        // Check if listing description field is empty
        if (!formData.listing_description) {
            newErrors.listing_description = ["Description is required"];
        }

        // Checks if minimum price is empty
        if (!formData.minimum_price) {
            newErrors.minimum_price = ["A minimum price is required"];
        }

        // Checks if there is at least one image provided
        if (formData.images.length < 1) {
            newErrors.images = ["There should be at least 1 image"];
        }

        if (formData.days_available <= 0) {
            newErrors.days_available = ["The available days value should be greater than 0."];
        }

        return newErrors;
    };

    const handle_remove_image = (index) => {
        const new_images = [...formData.images];
        new_images.splice(index, 1);
        setFormData((prevData) => ({ ...prevData, images: new_images }));
    };

    const getProfitStructure = async () => {
        try {
            const response = await fetch(`${api_base_url}/api/get-profit-structure`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                const { manager_split, expert_split } = data.profit_data;
                setMFee(manager_split);
                setEFee(expert_split);
            } else {
                alert(data.Error || "Failed to fetch profit structure");
            }
        } catch (error) {
            console.error("Error fetching profit structure:", error);
        }
    };

    // Handle form submission - asynchronous function, as the function needs to wait
    // for the servers response before continuing
    const handle_submit = async (event) => {
        // Prevents resubmission when form is being submitted
        event.preventDefault();

        // Empties any previous errors before doing client side validation
        // e.g. errors from previous handle_submit call
        setErrors({});

        // Client-side validation
        const validationErrors = validateForm();

        // If there are any errors, add them to errors dict and stop the form submission
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const selected_tag_names = selected_tags.map((tag) => tag.value);

        // Need to append the data again because FormData doesn't automatically include the existing formData.
        // This handles both text fields and files unlike FormData
        const form_data_to_send = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === "images") {
                value.forEach((image) => form_data_to_send.append("images", image));
            } else {
                form_data_to_send.append(key, value);
            }
        });

        // Appends the tags as a JSON string
        form_data_to_send.append("tags", JSON.stringify(selected_tag_names));

        // After client-side validation has been passed, makes a HTTP POST request to the
        // server to authenticate the user. The route/url passed has to be the same as the route
        // defined in views.py (http::/..../api/<function_name>).
        // Note: '${api_base_url}/api/login' needs to be repalced with actual url once
        // the server is set up.

        try {
            const response = await fetch(`${api_base_url}/api/create-listing`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken },
                // Sends the form data to the server - can refer to views.py to see what server does
                body: form_data_to_send,
                credentials: "include",
            });

            // Waits for a response
            const data = await response.json();

            // If response is not ok (not err code 200)
            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    // No errors caught by the backend, but response still not ok
                    // Potential server failure/unknown error.
                    setErrors({ general: ["Failed to create listing! Here"] });
                }
            }

            // If response is ok (err code 200)
            else {
                alert("Listing created successfully!");
                navigate("/seller-dash");
            }
        } catch (error) {
            setErrors({ general: ["Unexpected error"] });
        }
    };

    // Where the actual html for the web page is described.
    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8" role="main">
            {/* Page Header */}
            <div className="mb-8 text-center">
                <h1
                    className="mb-4 text-2xl font-semibold text-center text-gray-800"
                    id="page-title"
                >
                    Create a New Listing
                </h1>
                <p className="mt-2 text-xl text-gray-500" aria-describedby="page-title">
                    Fill out the details for your auction item
                </p>
            </div>

            <div className="p-6 mb-8">
                <form onSubmit={handle_submit} className="space-y-4" aria-labelledby="page-title">
                    {errors.general &&
                        errors.general.map((error, index) => (
                            <div key={index} className="mb-2 text-center text-red-600" role="alert">
                                {error}
                            </div>
                        ))}

                    {/* Listing Name */}
                    <div>
                        <label
                            htmlFor="listing-name"
                            className="block mt-5 text-xl font-medium text-gray-700"
                        >
                            Listing Name
                        </label>
                        <input
                            id="listing-name"
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="text"
                            name="listing_name"
                            placeholder="Enter a name for your listing"
                            value={formData.listing_name}
                            onChange={handleChange}
                            required
                            aria-required="true"
                        />
                        {errors.listing_name &&
                            errors.listing_name.map((error, index) => (
                                <p key={index} className="mt-1 text-sm text-red-500" role="alert">
                                    {error}
                                </p>
                            ))}
                    </div>

                    {/* Listing Description */}
                    <div>
                        <label
                            htmlFor="listing-description"
                            className="block mt-5 text-xl font-medium text-gray-700"
                        >
                            Description
                        </label>
                        <textarea
                            id="listing-description"
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            name="listing_description"
                            placeholder="Describe your item in detail"
                            value={formData.listing_description}
                            onChange={handleChange}
                            required
                            aria-required="true"
                        />
                        {errors.listing_description &&
                            errors.listing_description.map((error, index) => (
                                <p key={index} className="mt-1 text-sm text-red-500" role="alert">
                                    {error}
                                </p>
                            ))}
                    </div>

                    {/* Minimum Price */}
                    <div>
                        <label
                            htmlFor="minimum-price"
                            className="block mt-5 text-xl font-medium text-gray-700"
                        >
                            Starting Price
                        </label>
                        <div className="relative">
                            <span
                                className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500"
                                aria-hidden="true"
                            >
                                £
                            </span>
                            <input
                                id="minimum-price"
                                className="w-full px-4 py-2 pl-8 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="number"
                                name="minimum_price"
                                min="0"
                                max="99999999"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.minimum_price}
                                onChange={handleChange}
                                required
                                aria-required="true"
                            />
                            {errors.minimum_price &&
                                errors.minimum_price.map((error, index) => (
                                    <p
                                        key={index}
                                        className="mt-1 text-sm text-red-500"
                                        role="alert"
                                    >
                                        {error}
                                    </p>
                                ))}
                        </div>
                        <span className="text-gray-600">
                            {Math.round(mFee * 100)}% Standard fee charged on winning bid
                        </span>
                    </div>

                    {/* Tag Selector */}
                    <div>
                        <label
                            className="block mt-5 text-xl font-medium text-gray-700"
                            id="tag-selector-label"
                        >
                            Select Tags
                        </label>
                        <Tag_selector
                            selected_tags={selected_tags}
                            set_selected_tags={set_selected_tags}
                            is_item_tags={true}
                            aria-labelledby="tag-selector-label"
                        />
                    </div>

                    {/* Days Available */}
                    <div>
                        <label
                            htmlFor="days-available"
                            className="block mt-5 text-xl font-medium text-gray-700"
                        >
                            Auction Duration (Days)
                        </label>
                        <input
                            id="days-available"
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="number"
                            name="days_available"
                            min="1"
                            max="5"
                            step="1"
                            placeholder="1-5 days"
                            value={formData.days_available}
                            onChange={handleChange}
                            required
                            aria-required="true"
                        />
                        {errors.days_available &&
                            errors.days_available.map((error, index) => (
                                <p key={index} className="mt-1 text-sm text-red-500" role="alert">
                                    {error}
                                </p>
                            ))}
                    </div>

                    {/* Authentication Request */}
                    <div className="pt-2">
                        <label
                            className="block mt-5 text-xl font-medium text-gray-700"
                            id="auth-request-label"
                        >
                            Authentication Request
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="authentication_request"
                                checked={formData.authentication_request}
                                onChange={handleChange}
                                className="w-4 h-4 focus:ring-blue-500"
                                aria-labelledby="auth-request-label"
                            />
                            <span className="text-gray-600">
                                Enable Authentication ({Math.round(eFee * 100)}% Expert fee added to
                                winning bid ➜ {Math.round(eFee * 100 + mFee * 100)}% Total listing
                                fee)
                            </span>
                        </label>
                    </div>

                    {/* File Upload */}
                    <div className="pt-2">
                        <label
                            htmlFor="item-images"
                            className="block mt-5 text-xl font-medium text-gray-700"
                        >
                            Item Images
                        </label>
                        <input
                            id="item-images"
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="file"
                            name="images"
                            accept="image/jpeg, image/png"
                            multiple
                            onChange={handle_file_change}
                            required
                            aria-required="true"
                        />

                        {/* Display list of uploaded files */}
                        {formData.images && formData.images.length > 0 && (
                            <div className="mt-3" role="region" aria-live="polite">
                                <p className="mb-2 text-gray-700">
                                    Uploaded files ({formData.images.length}):
                                </p>
                                <ul className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                    {Array.from(formData.images).map((file, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center justify-between py-1"
                                        >
                                            <div className="flex items-center text-gray-700">
                                                <Image
                                                    className="w-5 h-5 mr-2 text-blue-500"
                                                    aria-hidden="true"
                                                />
                                                <span className="max-w-xs truncate">
                                                    {file.name}
                                                </span>
                                                <span className="ml-2 text-sm text-gray-500">
                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </div>
                                            <button
                                                className="p-2 ml-2 text-white transition-colors bg-red-500 rounded right hover:bg-red-600"
                                                type="button"
                                                onClick={() => handle_remove_image(index)}
                                                aria-label={`Remove file ${file.name}`}
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {errors.images &&
                            errors.images.map((error, index) => (
                                <p key={index} className="mt-1 text-sm text-red-500" role="alert">
                                    {error}
                                </p>
                            ))}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-3 font-semibold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Create Listing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateListing;
