import React, { useState, useEffect } from "react";
import {useCSRF } from "../App"; // Calls the user

const Search_component = ({user, item,  update_search}) => { //Filtering is done in all available users or items hence only set_filtered IDs is needed
    // set_filtered_Ids updates the filtered_Ids in navbar, for it to get corresponding filtered items OR users and set those to update in original pages
    const [searchQuery, setSearchQuery] = useState(""); // Tracks user search input

    const { csrfToken } = useCSRF();


    const handleSearch = () => {
        if(searchQuery != null){
            setSearchQuery(searchQuery.trim()); // Set final search query for API call
        }
    };
        
    useEffect(() => {
        const fetchListings = async () => 
        {
            try {
                const search_filter_response = await fetch(
                    "http://localhost:5000/api/get_search_filter",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                        },
                        body: JSON.stringify({item: item, user: user, searchQuery: searchQuery}),
                        credentials: "include",
                    }
                );

                

                const filtered_data = await search_filter_response.json();


                if (search_filter_response.ok) {
                    
                
                update_search(filtered_data);
                console.log(filtered_data);
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

    

    return (
        <div className="flex-grow flex ml-2">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="p-2 rounded-md border border-gray-300 w-1/3"
                                aria-label="Search input"
                            />
                            <button
                                type="submit"
                                onClick={handleSearch}
                                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                aria-label="Submit search"
                            >
                                Search
                            </button>
                        </div>
    );
};

export default Search_component;