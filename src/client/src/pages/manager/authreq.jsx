import React, { useState, useEffect } from "react";
import "./authreq.css";
import ItemListing from "../../components/itemlisting";
import { useUser } from "../../App";

export default function MAuthReq() {
  const [pendingauth, setPendingAuth] = useState([]);
  const { user } = useUser();

  const getpendingauth = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/get-pending-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setPendingAuth(data["Authentication required"] || []); // Ensure it's always an array
      }
    } catch (error) {
      console.error("Error fetching items pending authentication:", error);
    }
  };

  useEffect(() => {
    if (user) getpendingauth();
  }, [user]);

  return (
    <div className="container p-6">
      <h1 className="text-3xl font-bold mb-6">Items Pending Authentication</h1>

      {!user ? (
        <p className="text-gray-600">Login to see items pending authentication</p>
      ) : pendingauth.length === 0 ? (
        <p className="text-gray-600">No items pending authentication</p>
      ) : (
        <div className="space-y-6">
          {pendingauth.map((item) => (
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
