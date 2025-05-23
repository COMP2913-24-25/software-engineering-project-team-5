import React, { useState, useEffect } from "react";
import { useCSRF } from "../App"; // Calls the user
import config from "../../config";

const Search_component = ({ user, item, update_search }) => {
    //Filtering is done in all available users or items hence only set_filtered IDs is needed
    // set_filtered_Ids updates the filtered_Ids in navbar, for it to get corresponding filtered items OR users and set those to update in original pages
    const [searchQuery, setSearchQuery] = useState(""); // Tracks user search input
    const { api_base_url } = config;
    const { csrfToken } = useCSRF();

    const handleSearch = () => {
        if (searchQuery != null) {
            setSearchQuery(searchQuery.trim()); // Set final search query for API call
        }
    };

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const search_filter_response = await fetch(
                    `${api_base_url}/api/get_search_filter`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                        },
                        body: JSON.stringify({ item: item, user: user, searchQuery: searchQuery }),
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
        </div>
    );
};

export default Search_component;
