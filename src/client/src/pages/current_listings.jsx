import React, { useState, useEffect } from "react";
//useState : to create and update state variables like searchQuery here
//useEffect : to render data/ execute "side effects" in the component
import { useLocation } from "react-router-dom";
import CategoryFilter from "../components/category_filter";
import { useNavigate } from "react-router-dom";
import { useCSRF } from "../App"; // Calls the user
import Listing_item from "../components/listing_items";
import "../App.css";
import Filter_component from "../components/Filter_Sidebar";
import config from "../../config";

export default function CurrentListings({ }) {
    const [listings, set_listings] = useState([]);
    const [price_filtered_listings, setprice_filtered_listings] = useState([]); // Stores price-filtered data
    const { csrfToken } = useCSRF();
    const { api_base_url } = config;

    const location = useLocation();
    const searchQuery = location.state?.searchQuery || "";

    useEffect(() => {
        const fetchListings = async () => {
            // console.log("SEARCH IN CURRENT LISTING :", searchQuery);
            try {
                const search_filter_response = await fetch(
                    `${api_base_url}/api/get_search_filter`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                        },
                        body: JSON.stringify({
                            item: true,
                            user: false,
                            searchQuery: searchQuery,
                        }),
                        credentials: "include",
                    }
                );

                const filtered_items = await search_filter_response.json();
                // console.log("Filtered items", filtered_items);

                if (search_filter_response.ok) {
                    set_listings(filtered_items);
                    setprice_filtered_listings(filtered_items);
                    // console.log("Fetched Listings: ", listings);
                } else {
                    console.error("Failed to fetch listings");
                }
            } catch (error) {
                console.error("Network error: ", error);
            }
        };
        fetchListings();
    }, [searchQuery]);

    const handle_filtered_listings = (filtered_listings) => {
        setprice_filtered_listings(filtered_listings);
    };

    return (
        <main role="main" className="min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-16 py-8">
            <header className="text-center mb-10">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800" aria-live="polite">
                    Current Listings
                </h1>
                <p className="mt-2 text-base sm:text-lg text-gray-500">
                    Browse items currently available across all categories.
                </p>
            </header>

            <section className="mb-10">
                <Filter_component
                    update_listings={handle_filtered_listings}
                    listings={listings}
                    aria-label="Filter listings"
                />
            </section>

            {price_filtered_listings.length === 0 ? (
                <p className="text-center text-gray-600 text-base sm:text-lg mt-20" aria-live="polite">
                    No current listings available.
                </p>
            ) : (
                <section
                    className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                    role="list"
                    aria-label="List of current listings"
                >
                    {price_filtered_listings.map((item) => (
                        <div
                            key={item.id}
                            role="listitem"
                            aria-label={`Listing for ${item.name || "an item"}`}
                            className="w-full"
                        >
                            <Listing_item item={item} />
                        </div>
                    ))}
                </section>
            )}
        </main>
    );
}
