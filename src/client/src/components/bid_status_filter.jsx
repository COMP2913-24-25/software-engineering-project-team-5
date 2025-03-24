import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../App";
import { ChevronDown, ChevronUp } from "lucide-react";
import config from "../../config";

//only price filtering implemented here
//Need to add bid_status, sorting filters,  verified/non verified, antique? etc
const Bid_Status_component = ({ update_listings, listings }) => {
    const [selectedbid_status, setSelectedbid_status] = useState("");
    const [tempBidStatus, setTempBidStatus] = useState(""); // Temporary state for the filter value
    const { csrfToken } = useCSRF();
    const { user } = useUser();
    const { api_base_url } = config;
    const [filter_applied, set_filter_applied] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const bid_statuss = [
        { label: "Bid Won", value: "won" },
        { label: "Out Bid", value: "out_bid" },
        { label: "Bid Payment Failed", value: "payment_failed" },
        { label: "Auction Expired", value: "expired" },
    ];

    //handles price range selection event
    const handlebid_statusChange = (event) => {
        const newValue = event.target.value;
        // Toggle the selected state for the checkboxes
        setTempBidStatus((prevValue) => (prevValue === newValue ? "" : newValue));
    };

    const handleApplyFilter = () => {
        set_filter_applied(!filter_applied);
        setSelectedbid_status(tempBidStatus);
    };

    const resetFilter = () => {
        setTempBidStatus("");
        setSelectedbid_status(""); // Reset the selected filter state
    };

    //gets ID's of all listings
    const listingIds = Array.isArray(listings) ? listings.map((listing) => listing.Item_id) : [];

    useEffect(() => {
        if (!listingIds || listingIds.length === 0) {
            console.log("No listings to filter");
            return;
        }

        const fetch_filteredlistings = async () => {
            // prints for testing :P
            // console.log("Filter selected: ", selectedbid_status);
            // console.log("Filtered_listings reached in filter :", listings);
            const response = await fetch(`${api_base_url}/api/get_bid_filtering`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },

                body: JSON.stringify({
                    bid_status: selectedbid_status,
                    listing_Ids: listingIds,
                }),
                credentials: "include",
            });
            if (!response.ok) {
                console.log("Response was not OK. Status:", response.status);
                const errorText = await response.text();
                console.log("Error Response:", errorText);
            } else {
                console.log("Filter returned");
            }

            const filtered_Ids = await response.json();
            // console.log("Filtered_IDs after filtering:", filtered_Ids);

            //get listings for all returned ID's
            const filteredListings = listings.filter((listing) =>
                filtered_Ids.includes(listing.Item_id)
            );

            // console.log("Filtered_listings after filtering:", filteredListings);

            update_listings(filteredListings);
        };
        if (selectedbid_status) {
            fetch_filteredlistings();
            // Apply the filter if one is selected else just set original listings
        } else {
            update_listings(listings);
        }
    }, [filter_applied]);

    return (
        <div className="p-6 bg-white shadow-lg rounded-lg">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800" id="bid-status-heading">
                    Bid Status
                </h2>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="text-blue-600 hover:text-blue-700 transition"
                    aria-expanded={isDropdownOpen ? "true" : "false"}
                    aria-controls="dropdown-content"
                    aria-label={
                        isDropdownOpen
                            ? "Close Bid Status filter dropdown"
                            : "Open Bid Status filter dropdown"
                    }
                >
                    {isDropdownOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
            </div>

            {isDropdownOpen && (
                <div
                    id="dropdown-content"
                    className="mt-6 space-y-4"
                    aria-labelledby="bid-status-heading"
                >
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {bid_statuss.map((status) => (
                            <label
                                key={status.value}
                                className="flex items-center space-x-2 cursor-pointer"
                                aria-label={`Select bid status: ${status.label}`}
                            >
                                <input
                                    type="checkbox"
                                    value={status.value}
                                    checked={tempBidStatus === status.value}
                                    onChange={handlebid_statusChange}
                                    className="peer hidden"
                                    aria-labelledby={`bid-status-${status.value}`}
                                />
                                <div
                                    className="w-5 h-5 border-2 border-gray-400 rounded-md flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600"
                                    role="presentation"
                                >
                                    {tempBidStatus === status.value && (
                                        <span className="text-white font-bold">✔</span>
                                    )}
                                </div>
                                <span
                                    className="text-gray-700 font-medium"
                                    id={`bid-status-${status.value}`}
                                >
                                    {status.label}
                                </span>
                            </label>
                        ))}
                    </div>
                    <button
                        onClick={handleApplyFilter}
                        className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition w-full"
                        aria-label="Apply selected bid status filters"
                    >
                        Apply Filter
                    </button>
                </div>
            )}
        </div>
    );
};

export default Bid_Status_component;
