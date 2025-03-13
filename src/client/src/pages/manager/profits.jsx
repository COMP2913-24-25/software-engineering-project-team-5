import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../../App";
import Chart from "../../components/chart";
import Table from "../../components/table";

export default function Dashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { csrfToken } = useCSRF();

    const [managerSplit, setManagerSplit] = useState(0.01);
    const [expertSplit, setExpertSplit] = useState(0.04);
    const [userSplit, setUserSplit] = useState(0.95);
    const [weeklyProfits, setWeeklyProfits] = useState([]);

    useEffect(() => {
        if (user && user.level_of_access === 3) {
            getProfitStructure();
            getSold();
        } else {
            navigate("/");
        }
    }, [user, navigate]);

    const getProfitStructure = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/get-profit-structure", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                const { manager_split, expert_split } = data.profit_data;
                setManagerSplit(manager_split);
                setExpertSplit(expert_split);
                setUserSplit(1 - manager_split - expert_split);
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
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify({ managerSplit, expertSplit }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("Profit structure updated successfully!");
            } else {
                alert(`Error: ${data.error || "Failed to update profit structure."}`);
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
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                const profitData = calculateProfit(data.sold_items);
                setWeeklyProfits(profitData);
            } else {
                alert(data.error || "Failed to fetch sold items.");
            }
        } catch (error) {
            console.error("Error fetching sold items:", error);
        }
    };

    const calculateProfit = (soldItems) => {
        const weeklyData = {};

        soldItems.forEach((item) => {
            const current_bid = item.Current_bid;
            let expertProfit = current_bid * item.Expert_split;
            let managerProfit = current_bid * item.Manager_split;

            const sold_date = new Date(item.Available_until);
            if (isNaN(sold_date.getTime())) return;

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

    const getWeekNumber = (date) => {
        const startDate = new Date(date.getFullYear(), 0, 1);
        const diff = date - startDate;
        return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
    };

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">Weekly Profits</h1>
                <p className="text-xl text-gray-500 mt-2">View profits and manage fee distribution.</p>
            </div>

            {/* Chart Section */}
            <div className="mb-8">
                <Chart
                    data={weeklyProfits}
                    xKey="week"
                    yKeys={["expertProfit", "managerProfit", "totalProfit"]}
                    colors={["#8884d8", "#82ca9d", "#ff7300"]}
                />
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto mb-8">
                <Table data={weeklyProfits} />
            </div>

            {/* Profit Structure Form */}
            <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Update Profit Structure</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="manager-split" className="block text-sm text-gray-700">
                            Manager Split (%)
                        </label>
                        <input
                            type="number"
                            id="manager-split"
                            value={managerSplit * 100}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value / 100);
                                setManagerSplit(value);
                                setUserSplit(1 - value - expertSplit);
                            }}
                            className="border border-gray-300 rounded-md p-2 w-full"
                        />
                    </div>

                    <div>
                        <label htmlFor="expert-split" className="block text-sm text-gray-700">
                            Expert Split (%)
                        </label>
                        <input
                            type="number"
                            id="expert-split"
                            value={expertSplit * 100}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value / 100);
                                setExpertSplit(value);
                                setUserSplit(1 - managerSplit - value);
                            }}
                            className="border border-gray-300 rounded-md p-2 w-full"
                        />
                    </div>

                    <div>
                        <label htmlFor="user-split" className="block text-sm text-gray-700">
                            User Split (%)
                        </label>
                        <input
                            type="number"
                            id="user-split"
                            value={(userSplit * 100).toFixed(3)}
                            readOnly
                            className="border border-gray-300 rounded-md p-2 w-full bg-gray-200"
                        />
                    </div>
                </div>

                <button
                    onClick={updateProfitStructure}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition w-full sm:w-auto"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
