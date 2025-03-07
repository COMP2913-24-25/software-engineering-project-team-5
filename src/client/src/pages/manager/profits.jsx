import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../../App";
import Chart from "../../components/chart";  // Import Chart component
import Table from "../../components/table";  // Import Table component

export default function Dashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { csrfToken } = useCSRF(); // Access the CSRF token

    const [soldItems, setSoldItems] = useState([]);
    const [managerSplit, setManagerSplit] = useState(0.01); // Default 1% split
    const [expertSplit, setExpertSplit] = useState(0.04); // Default 4% split
    const [userSplit, setUserSplit] = useState(0.95); // Default remaining user split
    const [weeklyProfits, setWeeklyProfits] = useState([]);  // Data for table and chart

    useEffect(() => {
        if (user && user.level_of_access === 3) {
            getProfitStructure();
            getSold();
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

    const getSold = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/get-sold", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken, // Include CSRF token in header
                },
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                setSoldItems(data.sold_items);
                const profitData = calculateProfit(data.sold_items);
                setWeeklyProfits(profitData);
            } else {
                alert(data.error || "Failed to fetch sold items.");
            }
        } catch (error) {
            console.error("Error fetching sold items:", error);
        }
    };

    // Calculate weekly profits (similar to `calculate_time_remaining` logic)
    const calculateProfit = (soldItems) => {
        const weeklyData = {};

        soldItems.forEach((item) => {
            const current_bid = item.Current_bid;
            let expertProfit = 0;
            let managerProfit = 0;
            if (item.Expert) {
                expertProfit = current_bid * item.Expert_split;
                managerProfit = current_bid * item.Manager_split;
            }
            else {
                expertProfit = current_bid * item.Expert_split;
                managerProfit = current_bid * item.Manager_split;
            }

            const sold_date = new Date(item.Available_until);

            if (isNaN(sold_date.getTime())) {
                console.error("Invalid date format:", item.Available_until);
                return;
            }

            // Get the week number
            const weekNumber = getWeekNumber(sold_date);

            if (!weeklyData[weekNumber]) {
                weeklyData[weekNumber] = { expertProfit: 0, managerProfit: 0, totalProfit: 0 };
            }

            weeklyData[weekNumber].expertProfit += expertProfit;
            weeklyData[weekNumber].managerProfit += managerProfit;
            weeklyData[weekNumber].totalProfit += current_bid;
        });

        return Object.keys(weeklyData).map((week) => ({
            week,
            ...weeklyData[week],
        }));
    };

    // Function to get the week number from a given date
    const getWeekNumber = (date) => {
        const startDate = new Date(date.getFullYear(), 0, 1);
        const diff = date - startDate;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return Math.ceil(dayOfYear / 7); // Return the week number
    };

    return (
        <div className="dashboard p-6">
            <h2 className="text-2xl font-bold mb-6">Weekly Profits</h2>

            {/* Display Weekly Profits in a Graph */}
            <div className="mb-6">
                <Chart
                    data={weeklyProfits}
                    xKey="week"
                    yKeys={["expertProfit", "managerProfit", "totalProfit"]}
                    colors={["#8884d8", "#82ca9d", "#ff7300"]}
                />
            </div>

            {/* Display weekly profits in a table */}
            <div className="overflow-x-auto mb-6">
                <Table data={weeklyProfits} />
            </div>

            {/* Form to Update Profit Structure */}
            <div className="profit-structure p-4 border rounded shadow-lg">
                <h3 className="font-bold mb-4">Update Profit Structure</h3>
                <div className="mb-4">
                    <label htmlFor="manager-split" className="block text-sm">Manager Split:</label>
                    <input
                        type="number"
                        id="manager-split"
                        value={managerSplit}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setManagerSplit(value);
                            setUserSplit(1 - value - expertSplit); // Update user split automatically
                        }}
                        className="border rounded p-2"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="expert-split" className="block text-sm">Expert Split:</label>
                    <input
                        type="number"
                        id="expert-split"
                        value={expertSplit}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setExpertSplit(value);
                            setUserSplit(1 - managerSplit - value); // Update user split automatically
                        }}
                        className="border rounded p-2"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="user-split" className="block text-sm">User Split:</label>
                    <input
                        type="number"
                        id="user-split"
                        value={userSplit}
                        readOnly
                        className="border rounded p-2 bg-gray-200"
                    />
                </div>

                <button onClick={updateProfitStructure} className="bg-blue-500 text-white p-2 rounded">Save</button>
            </div>
        </div>
    );
}
