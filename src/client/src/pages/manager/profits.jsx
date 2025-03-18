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
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && user.level_of_access === 3) {
            getProfitStructure();
            getSold();
        } else {
            navigate("/invalid-access-rights");
        }
    }, [user, navigate]);

    const validateSplits = (manager, expert) => {
        if (manager < 0 || manager > 1 || expert < 0 || expert > 1) {
            setError("Manager and Expert split must be between 0% and 100%.");
            return false;
        }
        const calculatedUserSplit = 1 - manager - expert;
        if (calculatedUserSplit < 0) {
            setError("Invalid split values. User split cannot be negative.");
            return false;
        }
        setError("");
        return true;
    };

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
        if (error !== "") { return }

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
                <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
                    Weekly Profits
                </h1>
                <p className="text-xl text-gray-500 mt-2">
                    View profits and manage fee distribution.
                </p>
            </div>

            <div className="mb-8">
                <Chart
                    data={weeklyProfits}
                    xKey="week"
                    yKeys={["expertProfit", "managerProfit", "totalProfit"]}
                    colors={["#8884d8", "#82ca9d", "#ff7300"]}
                />
            </div>

            <div className="overflow-x-auto mb-8">
                <Table data={weeklyProfits} />
            </div>

            <div className="p-6 rounded-lg">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Update Profit Structure
                </h2>

                {error && <p className="text-red-600 mb-4">{error}</p>}

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
                                const value = e.target.value.trim() === "" ? 0 : parseFloat(e.target.value) / 100;
                                if (!isNaN(value) && validateSplits(value, expertSplit)) {
                                    setManagerSplit(value);
                                    setUserSplit(1 - value - expertSplit);
                                }
                            }}
                            min="0"
                            max="100"
                            placeholder="0"
                            className="border border-gray-300 rounded-md p-2 w-full"
                            required
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
                                const value = e.target.value.trim() === "" ? 0 : parseFloat(e.target.value) / 100;
                                if (!isNaN(value) && validateSplits(managerSplit, value)) {
                                    setExpertSplit(value);
                                    setUserSplit(1 - managerSplit - value);
                                }
                            }}

                            min="0"
                            max="100"
                            placeholder="0"
                            className="border border-gray-300 rounded-md p-2 w-full"
                            required
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
                            min="0"
                            max="100"
                        />
                    </div>
                </div>

                <button
                    onClick={updateProfitStructure}
                    disabled={error !== ""}
                    className={`mt-6 font-semibold py-2 px-4 rounded-md transition w-full sm:w-auto 
                        ${error ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                >
                    Save Changes
                </button>

            </div>
        </div>
    );
}