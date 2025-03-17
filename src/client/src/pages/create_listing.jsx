import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App"; // Access the user
import { useNavigate } from "react-router-dom";
import Tag_selector from "../components/tags_dropdown";
import { Image } from "lucide-react";

const CreateListing = () => {
    /*
    Allows a logged in user to create a listing- front end only handles simple form 
    validation, and routing to the different page upon successful login (currently
    redirects to signup page).

    Makes use of form created in forms.py so that input validation is handled server-side.
    */

    const navigate = useNavigate();

    // Creates the user object to be accessible
    const { user } = useUser();

    const { csrfToken } = useCSRF();

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
        // Note: 'http://localhost:5000/api/login' needs to be repalced with actual url once
        // the server is set up.

        try {
            const response = await fetch("http://localhost:5000/api/create-listing", {
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
                navigate("/home-page");
            }
        } catch (error) {
            setErrors({ general: ["Unexpected error"] });
        }
    };

    // Where the actual html for the web page is described.
    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            {/* Page Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Create a New Listing
                </h1>
                <p className="text-xl text-gray-500 mt-2">
                    Fill out the details for your auction item
                </p>
            </div>

            <div className="p-6 mb-8">
                <form onSubmit={handle_submit} className="space-y-4">
                    {errors.general &&
                        errors.general.map((error, index) => (
                            <div key={index} className="text-red-600 text-center mb-2">
                                {error}
                            </div>
                        ))}

                    {/* Listing Name */}
                    <div>
                        <label className="block text-gray-700 text-xl font-medium mt-5">
                            Listing Name
                        </label>
                        <input
                            className="bg-white w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="text"
                            name="listing_name"
                            placeholder="Enter a name for your listing"
                            value={formData.listing_name}
                            onChange={handleChange}
                            required
                        />
                        {errors.listing_name &&
                            errors.listing_name.map((error, index) => (
                                <p key={index} className="text-red-500 text-sm mt-1">
                                    {error}
                                </p>
                            ))}
                    </div>

                    {/* Listing Description */}
                    <div>
                        <label className="block text-gray-700 text-xl font-medium mt-5">
                            Description
                        </label>
                        <textarea
                            className="bg-white w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            name="listing_description"
                            placeholder="Describe your item in detail"
                            value={formData.listing_description}
                            onChange={handleChange}
                            required
                        />
                        {errors.listing_description &&
                            errors.listing_description.map((error, index) => (
                                <p key={index} className="text-red-500 text-sm mt-1">
                                    {error}
                                </p>
                            ))}
                    </div>

                    {/* Tag Selector */}
                    <div>
                        <label className="block text-gray-700 text-xl font-medium mt-5">
                            Item Categories
                        </label>
                        <Tag_selector
                            selected_tags={selected_tags}
                            set_selected_tags={set_selected_tags}
                        />
                    </div>

                    {/* Minimum Price */}
                    <div>
                        <label className="block text-gray-700 text-xl font-medium mt-5">
                            Starting Price
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                £
                            </span>
                            <input
                                className="bg-white w-full pl-8 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type="number"
                                name="minimum_price"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.minimum_price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    ))
                }

                {/* Listing Name */}
                <div>
                    <input
                        className="bg-white w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="text"
                        name="listing_name"
                        placeholder="Listing Name"
                        value={formData.listing_name}
                        onChange={handleChange}
                        required
                    />
                    {errors.listing_name &&
                        errors.listing_name.map((error, index) => (
                            <p key={index} className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                {/* Listing Description */}
                <div>
                    <textarea
                        className="bg-white w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        name="listing_description"
                        placeholder="Description"
                        value={formData.listing_description}
                        onChange={handleChange}
                        required
                    />
                    {errors.listing_description &&
                        errors.listing_description.map((error, index) => (
                            <p key={index} className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                {/* Tag Selector */}
                <div>
                    <Tag_selector selected_tags={selected_tags} set_selected_tags={set_selected_tags} is_item_tags={true}/>
                </div>

                {/* Minimum Price */}
                <div>
                    <input
                        className="bg-white w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="number"
                        name="minimum_price"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={formData.minimum_price}
                        onChange={handleChange}
                        required
                    />
                    {errors.minimum_price &&
                        errors.minimum_price.map((error, index) => (
                            <p key={index} className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                    {/* Days Available */}
                    <div>
                        <label className="block text-gray-700 text-xl font-medium mt-5">
                            Auction Duration (Days)
                        </label>

                        <input
                            className="bg-white w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="number"
                            name="days_available"
                            min="1"
                            max="5"
                            step="1"
                            placeholder="1-5 days"
                            value={formData.days_available}
                            onChange={handleChange}
                            required
                        />
                        {errors.days_available &&
                            errors.days_available.map((error, index) => (
                                <p key={index} className="text-red-500 text-sm mt-1">
                                    {error}
                                </p>
                            ))}
                    </div>

                    {/* Authentication Request */}
                    <div className="pt-2">
                        <label className="block text-gray-700 text-xl font-medium mt-5">
                            Authentication Request
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="authentication_request"
                                checked={formData.authentication_request}
                                onChange={handleChange}
                                className="focus:ring-blue-500 h-4 w-4"
                            />
                            <span className="text-gray-600">
                                Enable Authentication (5% fee of winning bid if approved)
                            </span>
                        </label>
                    </div>

                    {/* File Upload */}
                    <div className="pt-2">
                        <label className="block text-gray-700 text-xl font-medium mt-5">
                            Item Images
                        </label>
                        <input
                            className="bg-white w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="file"
                            name="images"
                            accept="image/*"
                            multiple
                            onChange={handle_file_change}
                            required
                        />

                        {/* Display list of uploaded files */}
                        {formData.images && formData.images.length > 0 && (
                            <div className="mt-3">
                                <p className="text-gray-700 mb-2">
                                    Uploaded files ({formData.images.length}):
                                </p>
                                <ul className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                    {Array.from(formData.images).map((file, index) => (
                                        <li key={index} className="flex items-center py-1">
                                            <div className="flex items-center text-gray-700">
                                                <Image className="h-5 w-5 mr-2 text-blue-500" />
                                                <span className="truncate max-w-xs">
                                                    {file.name}
                                                </span>
                                                <span className="ml-2 text-gray-500 text-sm">
                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {errors.images &&
                            errors.images.map((error, index) => (
                                <p key={index} className="text-red-500 text-sm mt-1">
                                    {error}
                                </p>
                            ))}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
