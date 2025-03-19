import React, { useState, useEffect } from "react";
//useState : to create and update state variables like searchQuery here
//useEffect : to render data/ execute "side effects" in the component
import { useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useCSRF } from "../App"; // Calls the user
import Listing_item from "../components/listing_items";
import "../App.css";
import Filter_component from "../components/Filter_Sidebar";
// import Navbar from "../components/navbar";
export default function CurrentListings({}) {
    const [listings, set_listings] = useState([]);
    const [price_filtered_listings, setprice_filtered_listings] = useState([]); // Stores price-filtered data
    const navigate = useNavigate();
    const { csrfToken } = useCSRF();
 
    const location = useLocation();
    const searchQuery = location.state?.searchQuery || ""; 
    //default is not actually "" but " "
  


    useEffect(() => {
        const fetchListings = async () => {
            // console.log("SEARCH IN CURRENT LISTING :", searchQuery);
            try {
                const search_filter_response = await fetch(
                    "http://localhost:5000/api/get_search_filter",
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

    //no committed yet
    // const handleItemClick = (item) => {
    //     navigate("/enlarge_listing", { state: { item } });
    // };

    const calculate_time_remaining = (availableUntil) => {
        const endTime = new Date(availableUntil).getTime();
        const now = new Date().getTime();
        const diffMs = endTime - now;

        if (diffMs <= 0) {
            const expiredDate = new Date(availableUntil).toLocaleString();
            return `Expired on ${expiredDate}`;
        }

        // Calculate hours, minutes, and seconds
        const seconds = Math.floor((diffMs / 1000) % 60);
        const minutes = Math.floor((diffMs / 60000) % 60);
        const hours = Math.floor(diffMs / 3600000);

        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            set_listings((prev) =>
                prev.map((item) => ({
                    ...item,
                    timeRemaining: calculate_time_remaining(item.Available_until),
                }))
            );
        }, 1000); // Update every second

        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    const [sidebarVisible, setSidebarVisible] = useState(false);

    const toggleSidebar = () => {
        setSidebarVisible((prev) => !prev);
    };

    const handle_filtered_listings = (filtered_listings) => {
        // console.log("Filtered being set ", filtered_listings);

        setprice_filtered_listings(filtered_listings);
    };
    const handle_listings_Searchfilter = ({ filtered_listings }) => {
        // const queryParam = encodeURIComponent(searchQuery); // Encode the search query  to safely parse
        set_listings(filtered_listings);
    };

    // useEffect(() => {
    //     console.log("Filtered after set", price_filtered_listings);
    // }, [price_filtered_listings]);

    return (
        <div className="container mx-auto p-8 text-center">
            {/* <div>
            <label>Min Price: </label>
            <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
            />
            
            <label>Max Price: </label>
            <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
            />
        </div> */}
            {/* <Navbar user={false} item={true} to_be_filtered={listings} handle_set_filtered={handle_listings_Searchfilter} /> */}
            <Filter_component update_listings={handle_filtered_listings} listings={listings} />
            {/* <h3 className="text-lg mb-4">Search Query: {searchQuery}</h3> */}
            <h1 className="text-3xl font-bold mb-6">Current Listings</h1>
            <div className="relative flex items-center justify-center">
                {price_filtered_listings.length === 0 ? (
                    <p className="text-gray-600">No current listings available.</p>
                ) : (
                    <div className="flex overflow-x-auto space-x-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 scrollbar-hide">
                        {price_filtered_listings.map((item) => (
                            <div
                                key={item.id}
                                className="min-w-[40%] sm:min-w-0 sm:w-auto"
                            >

                                    <Listing_item key={item.id} item={item} />
                            </div>
                        ))}
                    </div>
                )}
                
                {/* <button
                    className="absolute left-2 bg-white shadow-md p-2 sm:p-3 rounded-full text-gray-600 hover:bg-gray-200 transition sm:flex"
                    onClick={() => prevPage("price_filtered")}
                >
                    <ChevronLeft size={28} />
                </button> */}

                <button
                    className="absolute right-2 bg-white shadow-md p-2 sm:p-3 rounded-full text-gray-600 hover:bg-gray-200 transition sm:flex"
                    onClick={() => nextPage("price_filtered")}
                >
                    <ChevronRight size={28} />
                </button>
            </div>

        </div>
    );
}
