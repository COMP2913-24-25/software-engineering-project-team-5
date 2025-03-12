import React, { useState, useEffect } from "react";
import "../App.css"; // Initial imports needed
import { useUser, useCSRF } from "../App"; // Calls the user
import Listing_item from "../components/listing_items";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HomePage = () => {
    const { user } = useUser();
    const { csrfToken } = useCSRF();

    // Get a call to the back end to retrieve some data about listings. We need some items that are in the verified items and some that aren't.

    const [items, setItems] = useState([]);
    const [verified_items, set_verified_items] = useState([]);
    const [unverified_items, set_unverified_items] = useState([]);
    const [verified_index, set_verified_index] = useState(0);
    const [unverified_index, set_unverified_index] = useState(0);
    const items_per_page = 4;

    // Fetching the listings
    useEffect(() => {
        const fetch_items = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/get-items",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                        },
                        credentials: "include",
                    }
                );
                const data = await response.json();

                if (response.ok) {
                    setItems(data); // Update state with items

                    // Split the items into verified and unverified
                    const verified = data.filter(
                        (item) => item.Verified === true
                    );
                    const unverified = data.filter(
                        (item) => item.Verified === false
                    );

                    set_verified_items(verified);
                    set_unverified_items(unverified);
                } else {
                    console.error("Failed to get the listings");
                }
            } catch (error) {
                console.error("Network error: ", error);
            }
        };

        fetch_items();
    }, []);

    // Handling the next page for the items catalogue wheel
    const nextPage = (type) => {
        if (type == "verified") {
            set_verified_index((prev) =>
                prev + items_per_page < verified_items.length
                    ? prev + items_per_page
                    : prev
            );
        } else {
            set_unverified_index((prev) =>
                prev + items_per_page < unverified_items.length
                    ? prev + items_per_page
                    : prev
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

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Hero Section */}
            <div className="bg-blue-500 text-white py-16 px-4 text-center">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-wide">Welcome to Bidly</h1>
                <p className="text-md sm:text-lg mt-3 opacity-90">Discover and bid on amazing products effortlessly.</p>
            </div>

            <div className="container mx-auto py-12 px-4">
                {/* Unverified Items Section */}
                <div className="mb-12">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 text-center mb-4">
                        Explore New Arrivals
                    </h2>
                    <div className="relative flex items-center justify-center">
                        <button
                            className="absolute left-2 bg-white shadow-md p-2 sm:p-3 rounded-full text-gray-600 hover:bg-gray-200 transition hidden sm:flex"
                            onClick={() => prevPage("unverified")}
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <div className="flex overflow-x-auto space-x-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 scrollbar-hide">
                            {unverified_items
                                .slice(unverified_index, unverified_index + items_per_page)
                                .map((item, index) => (
                                    <div className="min-w-[70%] sm:min-w-0 sm:w-auto">
                                        <Listing_item key={index} item={item} />
                                    </div>
                                ))}
                        </div>
                        <button
                            className="absolute right-2 bg-white shadow-md p-2 sm:p-3 rounded-full text-gray-600 hover:bg-gray-200 transition hidden sm:flex"
                            onClick={() => nextPage("unverified")}
                        >
                            <ChevronRight size={28} />
                        </button>
                    </div>
                </div>

                {/* Verified Items Section */}
                <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 text-center mb-4">
                        Shop Authentic
                    </h2>
                    <div className="relative flex items-center justify-center">
                        <button
                            className="absolute left-2 bg-white shadow-md p-2 sm:p-3 rounded-full text-gray-600 hover:bg-gray-200 transition hidden sm:flex"
                            onClick={() => prevPage("verified")}
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <div className="flex overflow-x-auto space-x-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 scrollbar-hide">
                            {verified_items
                                .slice(verified_index, verified_index + items_per_page)
                                .map((item, index) => (
                                    <div className="min-w-[70%] sm:min-w-0 sm:w-auto">
                                        <Listing_item key={index} item={item} />
                                    </div>
                                ))}
                        </div>
                        <button
                            className="absolute right-2 bg-white shadow-md p-2 sm:p-3 rounded-full text-gray-600 hover:bg-gray-200 transition hidden sm:flex"
                            onClick={() => nextPage("verified")}
                        >
                            <ChevronRight size={28} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default HomePage;