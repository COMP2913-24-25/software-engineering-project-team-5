import React, { useState, useEffect } from "react";
import { useCSRF } from "../App";

//only price filtering implemented here
//Need to add bid_status, sorting filters,  verified/non verified, antique? etc
const Filter_component = ({ update_listings, listings }) => {
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const { csrfToken } = useCSRF();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filter_applied, set_filter_applied] = useState(true);
  // const priceRanges = [
  //   { label: "Less than £50", value: "less_than_50" },
  //   { label: "£50 - £200", value: "50_200" },
  //   { label: "£200 - £500", value: "200_500" },
  //   { label: "More than £500", value: "more_than_500" },
  // ];

  const handleMinPriceChange = (event) => {
    const value = event.target.value;
    if (value < 0) {
      alert("Min price must be greater than 0");
    }
    else{
    setMinPrice(value);
    }
  };

  // handles the change for max price input
  const handleMaxPriceChange = (event) => {
    const value = event.target.value;
    if (value < 0) {
      alert("Max price must be greater than 0");
    }
    else{
      setMaxPrice(value);
      }
  };
  //handles price range selection event
  // const handlePriceRangeChange = (event) => {
  //   const newValue = event.target.value;
  //   setSelectedPriceRange((prevValue) => (prevValue === newValue ? "" : newValue));
  // };
  
  //gets ID's of all listings
  const listingIds = listings.map(listing => listing.Item_id);
 
const handleApplyFilter = () => {
  set_filter_applied(!filter_applied)
}
  useEffect(() =>
    {

    const fetch_filteredlistings = async() =>
    {
        // prints for testing :P
        // console.log("Filter selected: ", selectedPriceRange);
        // console.log("Filtered_listings reached in filter :", listings);

      const min = parseFloat(minPrice) || 0; // Default to 0 if empty or invalid
      const max = parseFloat(maxPrice) || 9999999; 
      console.log("min : ", min, "max : ", max);
      if (min > max) {
        alert("Max price must be greater than Min price.");
        return;
      }
        const response = await fetch(
            "http://localhost:5000/api/get_filtered_listings",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                
                body: JSON.stringify({
                  min_price : min, max_price : max, 
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
    if (minPrice || maxPrice) {
      fetch_filteredlistings();
    } else {
      update_listings(listings); // If no filter, show all listings
    }
    }, [filter_applied]);


  return (
    <div className="p-4 bg-gray-100 shadow-md w-64">
    <h2 className="text-lg font-bold mb-4">Price Filter</h2>
    <div className="space-y-4">
      <div className="flex items-center">
        <label htmlFor="minPrice" className="mr-2">Min Price:</label>
        <input
          type="number"
          id="minPrice"
          value={minPrice}
          onChange={handleMinPriceChange}
          className="border p-2 rounded w-24"
          placeholder="Min Price"
        />
      </div>
      <div className="flex items-center">
        <label htmlFor="maxPrice" className="mr-2">Max Price:</label>
        <input
          type="number"
          id="maxPrice"
          value={maxPrice}
          onChange={handleMaxPriceChange}
          className="border p-2 rounded w-24"
          placeholder="Max Price"
        />
      </div>
      <button
          onClick={handleApplyFilter}
          className="mt-4 bg-blue-500 text-white p-2 rounded w-full"
        >
          Apply Filter
        </button>
    </div>
  </div>
  );
};

export default Filter_component;
