import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCSRF } from "../App";

const CategoryFilter = ({ update_listings}) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { csrfToken } = useCSRF();
  const [filter_applied, set_filter_applied] = useState(false);

  const categories = [
    { label: "Electronics", value: "electronics" },
    { label: "Furniture", value: "furniture" },
    { label: "Clothing", value: "clothing" },
    { label: "Books", value: "books" },
    { label: "Toys", value: "toys" },
    { label: "Sports", value: "sports" },
  ];

  const handleCategoryChange = (event) => {
    const { value } = event.target;
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((cat) => cat !== value) : [...prev, value]
    );
  };
  
  const handleApplyFilter = () => {
    set_filter_applied(!filter_applied)
  }

  useEffect(() => {
  const fetch_filteredlistings = async () => {
    const selectedString = selectedCategories.join(",");
    // const listingIds = listings?.map((listing) => listing.Item_id) || [];
    
    // if (!listingIds.length) {
    //   console.log("No listings to filter");
    //   return;
    // }

    try {
        console.log(JSON.stringify({
            categories: selectedString,
          //   listing_Ids: listingIds,
          }));
        const response = await fetch(
            "http://localhost:5000/api/get_category_filters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({
          categories: selectedString,
        //   listing_Ids: listingIds,
        }),
        credentials: "include",
      }
    );
      
      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const filtered_listings = await response.json();
    //   const filteredListings = listings.filter((listing) =>
    //     filteredIds.includes(listing.Item_id)
    //   );
    //   console.log(filtered_listings)
      update_listings(filtered_listings);
    } catch (error) {
      console.error("Filtering failed", error);
    }
  };
fetch_filteredlistings();
},[filter_applied]);

  return (
    <div className="p-3 m-2 bg-white shadow-lg rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Category Filter</h2>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="text-blue-600 hover:text-blue-700 transition"
        >
          {isDropdownOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {isDropdownOpen && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {categories.map((category) => (
              <label key={category.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={category.value}
                  checked={selectedCategories.includes(category.value)}
                  onChange={handleCategoryChange}
                  className="peer hidden"
                />
                <div className="w-4 h-4 border-1 border-gray-400 rounded-md flex items-center justify-center peer-checked:bg-blue-600 peer-checked:border-blue-600">
                  {selectedCategories.includes(category.value) && <span className="text-white font-bold">✔</span>}
                </div>
                <span className="text-gray-700 font-medium">{category.label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleApplyFilter}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition w-full"
          >
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
