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


export default function CurrentListings({}) {
    const [listings, set_listings] = useState([]);
    const [price_filtered_listings, setprice_filtered_listings] = useState([]); // Stores price-filtered data
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

   
    


    const handle_filtered_listings = (filtered_listings) => {
        
        setprice_filtered_listings(filtered_listings);
    };
    
   

    return (
        <div className="container mx-auto p-6 text-center">
           <div className="ml-5 mb-10 p-1 bg-gray-100 rounded-lg shadow-md">
                <Filter_component update_listings={handle_filtered_listings} listings={listings} />

                <CategoryFilter update_listings={handle_filtered_listings} />
            </div>

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
                
            </div>

        </div>
    );
}
