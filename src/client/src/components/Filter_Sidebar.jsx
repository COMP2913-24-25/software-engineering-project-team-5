import React, { useState, useEffect } from "react";
import { useCSRF } from "../App";

//only price filtering implemented here
//Need to add bid_status, sorting filters,  verified/non verified, antique? etc
const Filter_component = ({ update_listings, listings }) => {
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
    const { csrfToken } = useCSRF();

  const priceRanges = [
    { label: "Less than £50", value: "less_than_50" },
    { label: "£50 - £200", value: "50_200" },
    { label: "£200 - £500", value: "200_500" },
    { label: "More than £500", value: "more_than_500" },
  ];

  //handles price range selection event
  const handlePriceRangeChange = (event) => {
    const newValue = event.target.value;
    setSelectedPriceRange((prevValue) => (prevValue === newValue ? "" : newValue));
  };
  
  //gets ID's of all listings
  const listingIds = listings.map(listing => listing.Item_id);
 
  
  useEffect(() =>
    {

    const fetch_filteredlistings = async() =>
    {
        // prints for testing :P
        // console.log("Filter selected: ", selectedPriceRange);
        // console.log("Filtered_listings reached in filter :", listings);
        const response = await fetch(
            "http://localhost:5000/api/get_filtered_listings",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                
                body: JSON.stringify({
                  price_range: selectedPriceRange, 
                  listing_Ids: listingIds}),
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
    if (selectedPriceRange) {
      fetch_filteredlistings(); 
      // Apply the filter if one is selected else just set original listings
    } else {
      update_listings(listings); 
    }
    }, [selectedPriceRange]);


  return (
    <div className="p-4 bg-gray-100 shadow-md w-64">
      <h2 className="text-lg font-bold mb-4">Price Filter</h2>
      <div className="space-y-2">
        {priceRanges.map((range) => (
          <div key={range.value} className="flex items-center">
            <input
              type="checkbox" 
              id={range.value}
              name="priceRange"
              value={range.value}
              checked={selectedPriceRange === range.value}
              onChange={handlePriceRangeChange}
              className="mr-2"
            />
            <label htmlFor={range.value}>{range.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Filter_component;
