import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../../App";

export default function Dashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { csrfToken } = useCSRF(); // Access the CSRF token


    const [managerSplit, setManagerSplit] = useState(0.01); // Default 1% split
    const [expertSplit, setExpertSplit] = useState(0.04); // Default 4% split
    const [userSplit, setUserSplit] = useState(0.95); // Default remaining user split

    useEffect(() => {
        if (user && user.level_of_access === 3) {
            getProfitStructure();
        } else {
            navigate("/");
        }
    }, [user, navigate]);

    // Fetch profit structure from backend
    const getProfitStructure = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/get-profit-structure", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok && response.status === 200) {
                if (data.profit_data) {
                    const { manager_split, expert_split } = data.profit_data;

                    // Set state with fetched profit structure
                    setManagerSplit(manager_split);
                    setExpertSplit(expert_split);
                    setUserSplit(1 - manager_split - expert_split);
                }
            } else {
                alert(data.Error || "Failed to fetch profit structure");
            }
        } catch (error) {
            console.error("Error fetching profit structure:", error);
        }
    };

    const updateProfitStructure = async () => {
        try {

            const response = await fetch("http://localhost:5000/api/update-profit-structure", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken // Include CSRF token in header
                },
                credentials: "include",
                body: JSON.stringify({ managerSplit, expertSplit }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Profit structure updated successfully!");
            } else {
                alert(`Error: ${data.error || data.message || "Failed to update profit structure."}`);
            }
        } catch (error) {
            console.error("Network or server error:", error);
        }
    };

    return (
        <div className="dashboard">
            <h2>Weekly Profits</h2>
            <div className="profit-structure">
                <div>
                    <label htmlFor="manager-split">Manager Split:</label>
                    <input
                        type="number"
                        id="manager-split"
                        value={managerSplit}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setManagerSplit(value);
                            setUserSplit(1 - value - expertSplit); // Update user split automatically
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="expert-split">Expert Split:</label>
                    <input
                        type="number"
                        id="expert-split"
                        value={expertSplit}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setExpertSplit(value);
                            setUserSplit(1 - managerSplit - value); // Update user split automatically
                        }}
                    />
                </div>
                <div>
                    <label htmlFor="user-split">User Split:</label>
                    <input
                        type="number"
                        id="user-split"
                        value={userSplit.toFixed(3)}
                        readOnly
                    />
                </div>

                <button onClick={updateProfitStructure}>Save</button>

            </div>
        </div>
    );
}
