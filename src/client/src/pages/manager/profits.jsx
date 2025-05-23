import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../../App";
import Chart from "../../components/chart";
import Table from "../../components/table";
import config from "../../../config";

export default function Dashboard() {
    const { user } = useUser();
    const navigate = useNavigate();
    const { csrfToken } = useCSRF();
    const { api_base_url } = config;

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
            const response = await fetch(`${api_base_url}/api/get-profit-structure`, {
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
        if (error !== "") {
            return;
        }

        try {
            const response = await fetch(`${api_base_url}/api/update-profit-structure`, {
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
            const response = await fetch(`${api_base_url}/api/get-sold`, {
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
            const winning_bid = item.Bid_price;
            let ExpertProfit = winning_bid * item.Expert_split;
            let ManagerProfit = winning_bid * item.Manager_split;

            const sold_date = new Date(item.Available_until);
            if (isNaN(sold_date.getTime())) return;

            const weekNumber = getWeekNumber(sold_date);
            if (!weeklyData[weekNumber]) {
                weeklyData[weekNumber] = { ExpertProfit: 0, ManagerProfit: 0, totalProfit: 0 };
            }

            weeklyData[weekNumber].ExpertProfit += ExpertProfit;
            weeklyData[weekNumber].ManagerProfit += ManagerProfit;
            weeklyData[weekNumber].totalProfit += ExpertProfit + ManagerProfit;
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
        <div aria-live="polite" className="relative min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-12 py-8">
            <div className="text-center mb-10">
                <h1 aria-label="Weekly Profits Dashboard" className="text-2xl font-semibold text-center text-gray-800 mb-4">Weekly Profits</h1>
                <p aria-label="Monitor profits and adjust distribution settings" className="text-xl text-gray-500 mt-2">Monitor profits and adjust distribution settings.</p>
            </div>

            <div aria-labelledby="profit-chart" className="mb-10 overflow-x-auto mb-10 border shadow-md cursor-pointer hover:shadow-lg rounded-lg bg-white p-6">
                <Chart
                    data={weeklyProfits}
                    xKey="week"
                    yKeys={["ExpertProfit", "ManagerProfit", "totalProfit"]}
                    colors={["#4F46E5", "#16A34A", "#F97316"]}
                />
            </div>

            <div aria-labelledby="profit-table" className="overflow-x-auto mb-10 border shadow-md cursor-pointer hover:shadow-lg rounded-lg bg-white p-6">
                <Table data={weeklyProfits} />
            </div>

            <div className="bg-white border shadow-md cursor-pointer hover:shadow-lg rounded-lg p-6 md:p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Update Profit Structure</h2>
                {error && <p className="text-red-600 font-medium mb-4" role="alert">{error}</p>}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label aria-label="Manager Split (%)" htmlFor="manager-split" className="block text-sm font-medium text-gray-700">
                            Manager Split (%)
                        </label>
                        <input
                            type="number"
                            id="manager-split"
                            value={Math.round(managerSplit * 100)}
                            onChange={(e) => {
                                const value =
                                    e.target.value.trim() === ""
                                        ? 0
                                        : parseFloat(e.target.value) / 100;
                                if (!isNaN(value) && validateSplits(value, expertSplit)) {
                                    setManagerSplit(value);
                                    setUserSplit(1 - value - expertSplit);
                                }
                            }}
                            min="0"
                            max="100"
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            step="1"
                            required
                            aria-describedby="manager-split-description"
                        />
                    </div>
                    <div>
                        <label htmlFor="expert-split" className="block text-sm font-medium text-gray-700" aria-label="Expert Split (%)">
                            Expert Split (%)
                        </label>
                        <input
                            type="number"
                            id="expert-split"
                            value={Math.round(expertSplit * 100)}
                            onChange={(e) => {
                                const value =
                                    e.target.value.trim() === ""
                                        ? 0
                                        : parseFloat(e.target.value) / 100;
                                if (!isNaN(value) && validateSplits(managerSplit, value)) {
                                    setExpertSplit(value);
                                    setUserSplit(1 - managerSplit - value);
                                }
                            }}
                            min="0"
                            max="100"
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            step="1"
                            required
                            aria-describedby="expert-split-description"
                        />
                    </div>
                    <div>
                        <label htmlFor="user-split" className="block text-sm font-medium text-gray-700" aria-label="User Split (%)">
                            User Split (%)
                        </label>
                        <input
                            type="number"
                            id="user-split"
                            value={Math.round(userSplit * 100)}
                            readOnly
                            className="border border-gray-300 bg-gray-100 rounded-lg px-4 py-2 w-full cursor-not-allowed"
                            step="1"
                            aria-describedby="user-split-description"
                        />
                    </div>
                </div>

                <button
                    onClick={updateProfitStructure}
                    disabled={error !== ""}
                    className={`mt-6 w-full md:w-auto px-6 py-3 text-white font-semibold rounded-lg transition duration-300
                        ${error ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
                    aria-label="Save the profit structure changes"

                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
