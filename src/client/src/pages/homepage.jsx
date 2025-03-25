import React, { useState, useEffect } from "react";
import "../App.css"; // Initial imports needed
import { useUser, useCSRF } from "../App"; // Calls the user
import Listing_item from "../components/listing_items";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategoryFilter from "../components/category_filter";
import config from "../../config";

const HomePage = () => {
    const { user } = useUser();
    const { csrfToken } = useCSRF();
    const { api_base_url } = config;

    // Get a call to the back end to retrieve some data about listings. We need some items that are in the verified items and some that aren't.

    const [items, setItems] = useState([]);
    const [verified_items, set_verified_items] = useState([]);
    const [unverified_items, set_unverified_items] = useState([]);
    const [verified_index, set_verified_index] = useState(0);
    const [unverified_index, set_unverified_index] = useState(0);
    const [filtered_listings, setfiltered_listings] = useState([]); // Stores bid-status-filtered data
    const [loading, setLoading] = useState(true);
    const items_per_page = 4;

    // Handling the next page for the items catalogue wheel

    const nextPage = (type) => {
        if (type == "verified") {
            set_verified_index((prev) =>
                prev + items_per_page < verified_items.length ? prev + items_per_page : prev
            );
        } else {
            set_unverified_index((prev) =>
                prev + items_per_page < unverified_items.length ? prev + items_per_page : prev
            );
        }
    };

    // Handling the prev page for the items catalogue wheel
    const prevPage = (type) => {
        if (type == "verified") {
            set_verified_index((prev) =>
                prev - items_per_page >= 0 ? prev - items_per_page : prev
            );
        } else {
            set_unverified_index((prev) =>
                prev - items_per_page >= 0 ? prev - items_per_page : prev
            );
        }
    };

    const handle_filtered_listings = (filtered_listings) => {
        setfiltered_listings(filtered_listings);
        const verified = filtered_listings.filter((item) => item.Verified === true);
        const unverified = filtered_listings.filter((item) => item.Verified === false);

        set_verified_items(verified);
        set_unverified_items(unverified);
        setLoading(false);
    };

    return (
        <div className="relative min-h-screen bg-gray-100">
            {/* Hero Section */}
            <div className="px-4 py-16 text-center text-white bg-blue-500">
                <h1 className="text-3xl font-bold tracking-wide sm:text-5xl">Welcome to Bidly</h1>

                <p className="mt-3 text-md sm:text-lg opacity-90">
                    Discover and bid on amazing products effortlessly.
                </p>
            </div>
            <CategoryFilter update_listings={handle_filtered_listings} />
            {loading === true ? (
                <div className="py-20 text-center text-gray-600">
                    <div className="flex justify-center items-center">
                        <div className="w-16 h-16 border-t-4 border-blue-600 border-dashed rounded-full animate-spin" role="status" aria-label="Loading current bids"></div>
                    </div>
                    <p>Loading listings...</p>
                </div>
            ) : (
                <div className="container mx-auto py-12 px-[5%] md:px-[10%]">
                    {/* Unverified Items Section */}
                    <div className="mb-12">
                        <h2 className="mb-4 text-2xl font-semibold text-center text-gray-800 sm:text-3xl">
                            Explore New Arrivals
                        </h2>
                        <div className="relative flex items-center justify-center">
                            <div className="flex gap-4 space-x-4 overflow-x-auto sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 scrollbar-hide">
                                {unverified_items
                                    .slice(unverified_index, unverified_index + items_per_page)
                                    .map((item, index) => (
                                        <div key={index} className="min-w-[40%] sm:min-w-0 sm:w-auto">
                                            <Listing_item item={item} />
                                        </div>
                                    ))}
                            </div>

                            <button
                                className="absolute p-2 text-gray-600 transition bg-white rounded-full shadow-md left-2 sm:p-3 hover:bg-gray-200 sm:flex"
                                onClick={() => prevPage("unverified")}
                            >
                                <ChevronLeft size={28} />
                            </button>

                            <button
                                className="absolute p-2 text-gray-600 transition bg-white rounded-full shadow-md right-2 sm:p-3 hover:bg-gray-200 sm:flex"
                                onClick={() => nextPage("unverified")}
                            >
                                <ChevronRight size={28} />
                            </button>
                        </div>
                    </div>

                    {/* Verified Items Section */}
                    <div>
                        <h2 className="mb-4 text-2xl font-semibold text-center text-gray-800 sm:text-3xl">
                            Shop Authentic
                        </h2>
                        <div className="relative flex items-center justify-center">
                            <div className="flex gap-4 space-x-4 overflow-x-auto sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 scrollbar-hide">
                                {verified_items
                                    .slice(verified_index, verified_index + items_per_page)
                                    .map((item, index) => (
                                        <div key={index} className="min-w-[40%] sm:min-w-0 sm:w-auto">
                                            <Listing_item item={item} />
                                        </div>
                                    ))}
                            </div>

                            <button
                                className="absolute p-2 text-gray-600 transition bg-white rounded-full shadow-md left-2 sm:p-3 hover:bg-gray-200 sm:flex"
                                onClick={() => prevPage("verified")}
                            >
                                <ChevronLeft size={28} />
                            </button>

                            <button
                                className="absolute p-2 text-gray-600 transition bg-white rounded-full shadow-md right-2 sm:p-3 hover:bg-gray-200 sm:flex"
                                onClick={() => nextPage("verified")}
                            >
                                <ChevronRight size={28} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
