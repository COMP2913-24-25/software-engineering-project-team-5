import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../App";

//only price filtering implemented here
//Need to add bid_status, sorting filters,  verified/non verified, antique? etc
const Bid_Status_component = ({ update_listings, listings }) => {
  const [selectedbid_status, setSelectedbid_status] = useState("");
  const [tempBidStatus, setTempBidStatus] = useState("");  // Temporary state for the filter value
  const { csrfToken } = useCSRF();
  const { user } = useUser();
  
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

  const applyFilter = () => {
    setSelectedbid_status(tempBidStatus);
    console.log("FILTER APPLIED JHJB");
  };

  const resetFilter = () => {
    setTempBidStatus("");  
    setSelectedbid_status("");  // Reset the selected filter state
  };

  //gets ID's of all listings
  const listingIds = listings.map(listing => listing.Item_id);
 
  
  useEffect(() =>
    {

    const fetch_filteredlistings = async() =>
    {
        // prints for testing :P
        // console.log("Filter selected: ", selectedbid_status);
        // console.log("Filtered_listings reached in filter :", listings);
        const response = await fetch(
            "http://localhost:5000/api/get_bid_filtering",
            {
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
            },

        );
        if (!response.ok) {
            console.log("Response was not OK. Status:", response.status); 
            const errorText = await response.text(); 
            console.log("Error Response:", errorText); 
        }

        else 
        {
           console.log("Filter returned");
        }

        const filtered_Ids = await response.json();
        // console.log("Filtered_IDs after filtering:", filtered_Ids);
        
        //get listings for all returned ID's
        const filteredListings = listings.filter(listing => filtered_Ids.includes(listing.Item_id));
        
        // console.log("Filtered_listings after filtering:", filteredListings);

        update_listings(filteredListings);

    };
    if (selectedbid_status) {
      fetch_filteredlistings(); 
      // Apply the filter if one is selected else just set original listings
    } else {
      update_listings(listings); 
    }
    }, [selectedbid_status]);

    return (
      <div className="p-4 bg-gray-100 shadow-md w-64">
        <h2 className="text-lg font-bold mb-4">Bid Status</h2>
        <div className="space-y-2">
          {bid_statuss.map((range) => (
            <div key={range.value} className="flex items-center">
              <input
                type="checkbox"
                id={range.value}
                name="bid_status"
                value={range.value}
                checked={tempBidStatus === range.value}  // Use tempBidStatus for controlling checkbox
                onChange={handlebid_statusChange}
                className="mr-2"
              />
              <label htmlFor={range.value}>{range.label}</label>
            </div>
          ))}
        </div>
  
        {/* Apply Filter button */}
        <button 
          onClick={applyFilter}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Apply Filter
        </button>
      </div>
    );
};

export default Bid_Status_component;
