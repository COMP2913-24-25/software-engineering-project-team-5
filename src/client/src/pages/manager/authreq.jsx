import React, { useState, useEffect } from "react";
import ItemListing from "../../components/itemlisting";
import { useUser, useCSRF } from "../../App";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import config from "../../../config";

export default function MAuthReq() {
    const [pendingauth, setPendingAuth] = useState([]);
    const [experts, setExperts] = useState([]);
    const [selectedExperts, setSelectedExperts] = useState({});
    const { user } = useUser();
    const { csrfToken } = useCSRF();
    const navigate = useNavigate();
    const { api_base_url } = config;

    // Fetch items pending authentication
    const getPendingAuth = async () => {
        try {
            const response = await fetch(`${api_base_url}/api/get-pending-auth`, {
                method: "GET",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
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
            const response = await fetch(`${api_base_url}/api/get-expert-id`, {
                method: "GET",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
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

    // Assign an expert to an item
    const assignExpertToItem = async (item_id, expert_id) => {
        try {
            const response = await fetch(`${api_base_url}/api/update_item_auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrfToken },
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
        if (user?.level_of_access === 3) {
            getPendingAuth();
            getExpertList();
        } else {
            navigate("/invalid-access-rights");
        }
    }, [navigate, user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Items Pending Authentication
                </h1>
                <p className="text-xl text-gray-500 mt-2">
                    Assign authentication requests to experts.
                </p>
            </div>

            {!user ? (
                <p className="text-gray-600 text-center">
                    Login to see items pending authentication
                </p>
            ) : pendingauth.length === 0 ? (
                <p className="text-gray-600 text-center">No items pending authentication</p>
            ) : (
                <div className="space-y-6">
                    {pendingauth.map((item) => (
                        <div key={item.Item_id} className="bg-white p-4 rounded-lg border">
                            <ItemListing
                                images={item.Images}
                                itemId={item.Item_id}
                                title={item.Listing_name}
                                seller={item.Username}
                                description={item.Description}
                            />
                            <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Assign Expert:
                                </label>
                                <Select
                                    className="border border-gray-300 rounded-md w-full"
                                    value={
                                        selectedExperts[item.Item_id]
                                            ? experts.find(
                                                  (expert) =>
                                                      expert.Expert_id ===
                                                      selectedExperts[item.Item_id]
                                              )
                                                ? {
                                                      value: selectedExperts[item.Item_id],
                                                      label: experts.find(
                                                          (expert) =>
                                                              expert.Expert_id ===
                                                              selectedExperts[item.Item_id]
                                                      )?.Full_Name,
                                                  }
                                                : null
                                            : null
                                    }
                                    onChange={(selectedOption) =>
                                        setSelectedExperts({
                                            ...selectedExperts,
                                            [item.Item_id]: selectedOption
                                                ? selectedOption.value
                                                : "",
                                        })
                                    }
                                    options={experts.map((expert) => ({
                                        value: expert.Expert_id,
                                        label: `${expert.Full_Name} ${
                                            expert.Tags.length > 0
                                                ? `(${expert.Tags.join(", ")})`
                                                : ""
                                        }`,
                                    }))}
                                    isSearchable
                                    placeholder="Select an expert"
                                />
                            </div>
                            <button
                                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition w-full sm:w-auto"
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
