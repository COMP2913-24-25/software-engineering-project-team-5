import React, { useState, useEffect } from "react";
import "./authreq.css";

const ItemListing = ({ title, seller, description, image }) => {
  const imageUrl = image ? `data:image/png;base64,${image}` : null;

  return (
    <div className="flex border rounded-lg p-4 shadow-md bg-white w-full max-w-3xl items-center">
      <div className="w-32 h-32 bg-gray-200 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500">No Image</span>
        )}
      </div>
      <div className="flex flex-col flex-grow ml-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-gray-600">{seller}</p>
        <p className="text-sm text-gray-700 mt-1">{description}</p>
      </div>
    </div>
  );
};

export default function MAuthReq() {
  const [pendingauth, setPendingAuth] = useState([]);
  const [filter, setFilter] = useState("");

  const getpendingauth = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/get-pending-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setPendingAuth(data.pendingauth);
      }
    } catch (error) {
      console.error("Error fetching items pending authentication:", error);
    }
  };

  useEffect(() => {
    getpendingauth();
  }, []);

  const filterAuthItems = pendingauth.filter((item) =>
    item.Listing_name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="container p-6">
      <h1 className="text-3xl font-bold mb-6">Items Pending Authentication</h1>

      <input
        type="text"
        placeholder="Filter..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      {filterAuthItems.length === 0 ? (
        <p className="text-gray-600">No items pending authentication</p>
      ) : (
        <div className="space-y-6">
          {filterAuthItems.map((item) => (
            <ItemListing
              key={item.Item_id}
              image={item.Image ? `data:image/png;base64,${item.Image}` : null}
              title={item.Listing_name}
              seller={item.Seller_name}
              description={item.Description}
            />
          ))}
        </div>
      )}
    </div>
  );
}
