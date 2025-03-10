import React, { useState, useEffect } from "react"; 
//useState : to create and update state variables like searchQuery here
//useEffect : to render data/ execute "side effects" in the component
import { useNavigate } from "react-router-dom"; 
import {useCSRF } from "../App"; // Calls the user
import Listing_item from "../components/listing_items";
import "../App.css";
// import ItemListing from "../components/itemlisting";
import { ChevronRight } from "lucide-react";
import Filter_component from "../components/Filter_Sidebar";

export default function CurrentListings({searchQuery}) {
    const [listings, set_listings] = useState([]);
    const [price_filtered_listings, setprice_filtered_listings] = useState([]); // Stores price-filtered data
    // const [minPrice, setMinPrice] = useState(4);
    // const [maxPrice, setMaxPrice] = useState(100000); 
    // max min will be used when price filtering is through sliding convention

    const navigate = useNavigate();
    const [middle_type, set_middletype] = useState([]);
    const [types, set_types] = useState([]);
    const { csrfToken } = useCSRF();



    useEffect(() => {
        const fetchListings = async () => 
        {
            try {
                const listings_response = await fetch(
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

               

                const listings_data = await listings_response.json();


                if (listings_response.ok) {
                    

                       
                    //Filter works only for a single word searchQuery
                    //Need to move into database for filtering
                    //Filtering by name
                    //Item name : adidas shoe, then it would work for any letters entered in the right sequence
                    // works for : adi, a, adidas, s, sho, shoe
                    // does not work for : did, ho, adidas shoe
                    // should work for : adidas shoe
                    const filteredListings_search = searchQuery 
                    ? listings_data.filter((listings) =>{
                        if (!listings?.Listing_name) return false;
                            
                            const name_tokens = listings.Listing_name.toLowerCase().split(/\s+/); // Tokenize name
                            const search = searchQuery.toLowerCase().trim();
                            console.log("tokens ", name_tokens);
                            return name_tokens.some(token => token.startsWith(search)); 
                            
                })
                    : listings_data;
                   
                // set only by search Query
                set_listings(filteredListings_search);
                setprice_filtered_listings(filteredListings_search)
                // console.log("Fetched Listings: ", filteredListings); 

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
    const handleItemClick = (item) => {
        navigate("/enlarge_listing", { state: { item } });
    };


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
        const hours = Math.floor((diffMs / 3600000));

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

            <Filter_component update_listings={handle_filtered_listings} listings = {listings} />
            {/* <h3 className="text-lg mb-4">Search Query: {searchQuery}</h3> */}
            <h1 className="text-3xl font-bold mb-6">Current Listings</h1>
            {price_filtered_listings.length === 0 ? (
                <p className="text-gray-600">No current listings available.</p>
            ) : (
                price_filtered_listings.map((item) => (
                    <div 
                    key={item.id} 
                    className="bid-item p-4 border rounded-lg shadow-md flex gap-2 bg-yellow-100 relative" // Added relative for positioning arrow
                    > 

                    {/* Navigation Arrow Button : not working since enlarge lsiting not pushed */}
                        <button 
                            className="absolute top-2 right-2 bg-gray-200 p-1 rounded-full hover:bg-gray-300" 
                            onClick={() => handleItemClick(item)}
                        >
                            <ChevronRight size={20} />
                        </button>
                    
                        <div className="flex items-center gap-2 p-4 border rounded-lg shadow-md bg-green-100 w-full">
                        <Listing_item key={item.id} item={item} />
                        </div>
                    </div>
                    ))
                )}
        </div>
    );
}


