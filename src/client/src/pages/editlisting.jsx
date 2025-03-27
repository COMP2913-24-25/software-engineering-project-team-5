import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App";
import { useNavigate, useParams } from "react-router-dom";
import Tag_selector from "../components/tags_dropdown";
import { Image, Trash2 } from "lucide-react";
import config from "../../config";

const EditListing = () => {
    const navigate = useNavigate();
    const { Item_id } = useParams();
    const { api_base_url } = config;
    const { user } = useUser();
    const { csrfToken } = useCSRF();

    const [form_data, set_form_data] = useState({
        listing_name: "",
        listing_description: "",
        minimum_price: 0,
        days_available: 1,
    });

    const [errors, setErrors] = useState({});
    const [selected_tags, set_selected_tags] = useState([]);
    const [existing_images, set_existing_images] = useState([]);
    const [new_images, set_new_images] = useState([]);
    const [loading, set_loading] = useState(true);
    const [file_input_key, set_file_input_key] = useState(Date.now());

    useEffect(() => {
        if (user?.level_of_access === 1) {
            fetchItemDetails();
        } else {
            navigate("/invalid-access-rights");
        }
    }, [user, Item_id, navigate]);

    const fetchItemDetails = async () => {
        try {
            const response = await fetch(`${api_base_url}/api/get-listing-details/${Item_id}`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken },
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                set_form_data({
                    listing_name: data.listing_name,
                    listing_description: data.description,
                    minimum_price: data.min_price,
                    days_available: data.days_available || 1,
                });
                set_existing_images(data.images);
                set_selected_tags(
                    data.tags.map((tag) => ({ value: tag.type_id, label: tag.type_name }))
                );
                set_loading(false);
            } else {
                alert(data.error || "Failed to fetch listing details");
                navigate("/seller-dash");
            }
        } catch (error) {
            console.error("Error fetching item details:", error);
            navigate("/seller-dash");
        }
    };

    const handle_change = (event) => {
        const { name, value, type } = event.target;
        set_form_data((prev) => ({
            ...prev,
            [name]: type === "number" ? parseFloat(value) : value,
        }));
    };

    const handle_file_change = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            set_new_images((prev) => [...prev, ...Array.from(event.target.files)]);
            set_file_input_key(Date.now()); // Reset file input
        }
    };

    const handle_remove_image = (index, isNew) => {
        if (isNew) {
            set_new_images((prev) => prev.filter((_, i) => i !== index));
        } else {
            set_existing_images((prev) => prev.filter((_, i) => i !== index));
        }
    };

    const validate_form = () => {
        const newErrors = {};

        if (!form_data.listing_name.trim()) {
            newErrors.listing_name = ["Listing name is required"];
        }

        if (!form_data.listing_description) {
            newErrors.listing_description = ["Description is required"];
        }

        if (!form_data.minimum_price || form_data.minimum_price <= 0) {
            newErrors.minimum_price = ["A valid minimum price is required"];
        }

        if (form_data.days_available <= 0 || form_data.days_available > 5) {
            newErrors.days_available = ["Available days must be between 1 and 5"];
        }

        if (existing_images.length + new_images.length < 1) {
            newErrors.images = ["At least one image is required"];
        }

        return newErrors;
    };

    const handle_submit = async (event) => {
        event.preventDefault();
        setErrors({});

        const validationErrors = validate_form();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const form_data_to_send = new FormData();
        form_data_to_send.append("item_id", Item_id);
        form_data_to_send.append("listing_name", form_data.listing_name);
        form_data_to_send.append("listing_description", form_data.listing_description);
        form_data_to_send.append("minimum_price", form_data.minimum_price);
        form_data_to_send.append("days_available", form_data.days_available);
        form_data_to_send.append("tags", JSON.stringify(selected_tags.map((tag) => tag.value)));
        form_data_to_send.append(
            "images_to_keep",
            JSON.stringify(existing_images.map((img) => img.image_id))
        );

        new_images.forEach((image) => {
            form_data_to_send.append("new_images", image);
        });

        try {
            const response = await fetch(`${api_base_url}/api/update-listing`, {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken },
                body: form_data_to_send,
                credentials: "include",
            });

            const data = await response.json();
            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                } else {
                    setErrors({ general: ["Failed to update listing"] });
                }
            } else {
                alert("Listing updated successfully!");
                navigate("/seller-dash");
            }
        } catch (error) {
            setErrors({ general: ["An error occurred while updating the listing"] });
        }
    };

    if (loading) {
        return (
            <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto border-t-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Loading listing details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8" role="main">
            <div className="mb-8 text-center">
                <h1
                    className="mb-4 text-2xl font-semibold text-center text-gray-800"
                    id="page-title"
                >
                    Edit Listing
                </h1>
                <p className="mt-2 text-xl text-gray-500" aria-describedby="page-title">
                    Update the details for your auction item
                </p>
            </div>

            <div className="p-6 mb-8">
                <form onSubmit={handle_submit} className="space-y-4" aria-labelledby="page-title">
                    {errors.general && (
                        <div className="mb-2 text-center text-red-600" role="alert">
                            {errors.general}
                        </div>
                    )}

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
                            value={form_data.listing_name}
                            onChange={handle_change}
                            required
                            aria-required="true"
                        />
                        {errors.listing_name && (
                            <p className="mt-1 text-sm text-red-500" role="alert">
                                {errors.listing_name[0]}
                            </p>
                        )}
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
                            value={form_data.listing_description}
                            onChange={handle_change}
                            required
                            aria-required="true"
                        />
                        {errors.listing_description && (
                            <p className="mt-1 text-sm text-red-500" role="alert">
                                {errors.listing_description[0]}
                            </p>
                        )}
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
                                step="0.01"
                                placeholder="0.00"
                                value={form_data.minimum_price}
                                onChange={handle_change}
                                required
                                aria-required="true"
                            />
                        </div>
                        {errors.minimum_price && (
                            <p className="mt-1 text-sm text-red-500" role="alert">
                                {errors.minimum_price[0]}
                            </p>
                        )}
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
                            value={form_data.days_available}
                            onChange={handle_change}
                            required
                            aria-required="true"
                        />
                        {errors.days_available && (
                            <p className="mt-1 text-sm text-red-500" role="alert">
                                {errors.days_available[0]}
                            </p>
                        )}
                    </div>

                    {/* Existing Images */}
                    {existing_images.length > 0 && (
                        <div className="pt-2">
                            <label className="block mt-5 text-xl font-medium text-gray-700">
                                Current Images
                            </label>
                            <div className="mt-3">
                                <ul className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                    {existing_images.map((image, index) => (
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
                                                    Image {index + 1}
                                                </span>
                                            </div>
                                            <button
                                                className="p-2 ml-2 text-white transition-colors bg-red-500 rounded hover:bg-red-600"
                                                type="button"
                                                onClick={() => handle_remove_image(index, false)}
                                                aria-label={`Remove image ${index + 1}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <label
                            htmlFor="item-images"
                            className="block mt-5 text-xl font-medium text-gray-700"
                        >
                            Item Images
                        </label>
                        <input
                            id="item-images"
                            key={file_input_key}
                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type="file"
                            name="new_images"
                            accept="image/jpeg, image/png"
                            multiple
                            onChange={handle_file_change}
                        />

                        {new_images.length > 0 && (
                            <div className="mt-3" role="region" aria-live="polite">
                                <p className="mb-2 text-gray-700">
                                    New images to upload ({new_images.length}):
                                </p>
                                <ul className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                    {Array.from(new_images).map((file, index) => (
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
                                                className="p-2 ml-2 text-white transition-colors bg-red-500 rounded hover:bg-red-600"
                                                type="button"
                                                onClick={() => handle_remove_image(index, true)}
                                                aria-label={`Remove file ${file.name}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {errors.images && (
                        <p className="mt-1 text-sm text-red-500" role="alert">
                            {errors.images[0]}
                        </p>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-3 font-semibold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Update Listing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditListing;
