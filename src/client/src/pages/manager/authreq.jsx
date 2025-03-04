import React, { useState, useEffect } from "react";
import "./authreq.css";
import ItemListing from "../../components/itemlisting";
import { useUser } from "../../App";

export default function MAuthReq() {
  const [pendingauth, setPendingAuth] = useState([]);
  const [experts, setExperts] = useState([]);
  const [selectedExperts, setSelectedExperts] = useState({});
  const { user } = useUser();

  // Fetch items pending authentication
  const getPendingAuth = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/get-pending-auth", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setPendingAuth(data["Authentication required"] || []);
      }
    } catch (error) {
      console.error("Error fetching items pending authentication:", error);
    }
  };

  // Fetch available experts
  const getExpertList = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/get-expert-id", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setExperts(data["Available Experts"] || []);
      }
    } catch (error) {
      console.error("Error fetching experts:", error);
    }
  };
  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    // If imageData already includes the data URL prefix, use it as is
    if (imageData.startsWith("data:")) {
      return imageData;
    }
    // Otherwise, prepend the prefix
    return `data:image/png;base64,${imageData}`;
  };
  // Assign an expert to an item
  const assignExpertToItem = async (item_id, expert_id) => {
    try {
      const response = await fetch("http://localhost:5000/api/update_item_auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ item_id, expert_id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Expert assigned successfully!");
        getPendingAuth();
      } else {
        alert("Failed to assign expert: " + data.message);
      }
    } catch (error) {
      console.error("Error assigning expert:", error);
    }
  };

  useEffect(() => {
    if (user) {
      getPendingAuth();
      getExpertList();
    }
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
            <div key={item.Item_id} className="border p-4 rounded-lg">
              <ItemListing
                image={getImageUrl(item.Image)}
                title={item.Listing_name}
                seller={item.Username}
                description={item.Description}
              />
              <div className="mt-2">
                <label className="block text-sm font-medium">Assign Expert:</label>
                <select
                  className="border p-2 w-full rounded"
                  value={selectedExperts[item.Item_id] || ""}
                  onChange={(e) =>
                    setSelectedExperts({
                      ...selectedExperts,
                      [item.Item_id]: e.target.value,
                    })
                  }
                >
                  <option value="">Select an expert</option>
                  {experts.map((expert) => (
                    <option key={expert.Expert_id} value={expert.Expert_id}>
                      {expert.Username}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() =>
                  assignExpertToItem(item.Item_id, selectedExperts[item.Item_id])
                }
                disabled={!selectedExperts[item.Item_id]}
              >
                Assign Expert
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
