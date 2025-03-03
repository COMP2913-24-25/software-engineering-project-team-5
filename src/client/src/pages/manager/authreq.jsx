import React, { useState, useEffect } from "react";
import "./authreq.css";
import ItemListing from "../../components/itemlisting";

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
