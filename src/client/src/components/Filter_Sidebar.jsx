import React, { useState, useEffect } from "react";
import { useCSRF } from "../App";
import { ChevronDown, ChevronUp } from "lucide-react";
//only price filtering implemented here
//Need to add bid_status, sorting filters,  verified/non verified, antique? etc
const Filter_component = ({ update_listings, listings }) => {
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const { csrfToken } = useCSRF();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filter_applied, set_filter_applied] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


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

        // else 
        // {
        //    console.log("Filter returned");
        // }

        const filtered_Ids = await response.json();
        
        //get listings for all returned ID's
        const filteredListings = listings.filter(listing => filtered_Ids.includes(listing.Item_id));
        

        update_listings(filteredListings);

    };
    if (minPrice || maxPrice) {
      fetch_filteredlistings();
    } else {
      update_listings(listings); // If no filter, show all listings
    }
    }, [filter_applied]);

    return (
      <div className="p-6 bg-white shadow-lg rounded-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Price Filter</h2>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-blue-600 hover:text-blue-700 transition"
          >
            {isDropdownOpen ? (
              <ChevronUp size={24} />
            ) : (
              <ChevronDown size={24} />
            )}
          </button>
        </div>
    
        {isDropdownOpen && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="minPrice" className="text-gray-700 font-medium">Min Price:</label>
                <input
                  type="number"
                  id="minPrice"
                  value={minPrice}
                  onChange={handleMinPriceChange}
                  className="border-2 border-gray-300 p-3 rounded-lg w-28 focus:ring-2 focus:ring-blue-500"
                  placeholder="Min Price"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="maxPrice" className="text-gray-700 font-medium">Max Price:</label>
                <input
                  type="number"
                  id="maxPrice"
                  value={maxPrice}
                  onChange={handleMaxPriceChange}
                  className="border-2 border-gray-300 p-3 rounded-lg w-28 focus:ring-2 focus:ring-blue-500"
                  placeholder="Max Price"
                />
              </div>
              <button
                onClick={handleApplyFilter}
                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
              >
                Apply Filter
              </button>
            </div>
          </div>
        )}
      </div>
    );
    
};

export default Filter_component;
