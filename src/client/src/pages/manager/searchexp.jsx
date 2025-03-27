import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../../App";
import Manager_view_expert from "../../components/manager_view_expert";
import config from "../../../config";
import { List } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const get_start_of_week = () => {
    const today = new Date();
    const day_of_week = today.getDay();
    const start_of_week = new Date(today);
    start_of_week.setDate(today.getDate() - (day_of_week === 0 ? 6 : day_of_week - 1));
    return start_of_week.toISOString().split("T")[0];
};

const get_current_day = () => {
    const today = new Date();
    const day_of_week = today.getDay();

    if (day_of_week === 0) {
        return 7;
    }

    return day_of_week;
};

const SearchExperts = () => {
    // In this component I want to get a list of all the experts and their data.
    // Using the data I get from the backend, create manager_view_expert components of each expert.
    // Allow filtering based on their name and tags
    // Allow the manager to add tags to users, but that will be handled in the manager_view_expert component.

    const { user } = useUser();
    const navigate = useNavigate();
    const { csrfToken } = useCSRF();
    const { api_base_url } = config;
    const [loading, setLoading] = useState(true);

    const [experts, set_experts] = useState([]);
    const [search, set_search] = useState("");
    const [show_available_only, set_show_available_only] = useState(false);

    const fetch_experts = async () => {
        const week_start_date = get_start_of_week();
        try {
            const response = await fetch(`${api_base_url}/api/get-experts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                body: JSON.stringify({
                    week_start_date: week_start_date,
                    current_day: get_current_day(),
                }),
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                set_experts(data);
                console.log(data);
            } else {
                console.error("Failed to fetch experts");
            }
        } catch (error) {
            console.error("Error fetching experts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch_experts();
    }, [user.User_id, csrfToken]);

    // Search filter handling
    const filteredExperts = experts.filter((expert) => {
        const full_name = `${expert.First_name} ${expert.Middle_name || ""} ${expert.Surname}`
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
        const expertise = (expert.Expertise || []).join(" ").toLowerCase();
        const search_term = search.toLowerCase();
        const matches_search =
            full_name.startsWith(search_term) || expertise.startsWith(search_term);
        const matches_availability = !show_available_only || expert.is_available;
        return matches_search && matches_availability;
    });

    useEffect(() => {
        if (!(user?.level_of_access === 3)) {
            navigate("/invalid-access-rights");
        }
    }, [navigate, user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8" role="main">
            {/* Page Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4" id="page-title">
                    Search Experts
                </h1>
                <p className="text-lg text-gray-600" aria-describedby="page-title">Manage and search for experts.</p>
            </div>

            <div className="mb-8 flex flex-col sm:flex-row gap-6 relative" role="search">
                {/* Search Input */}
                <div className="flex-1">

                    <label htmlFor="expert-search" className="sr-only">
                        Search experts by name or expertise
                    </label>

                    <input
                        id="expert-search"
                        type="text"
                        className="p-3 border rounded-lg w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Search by name or expertise"
                        value={search}
                        onChange={(e) => set_search(e.target.value)}
                        aria-label="Search experts by name or expertise"
                    />
                </div>

                {/* Show Available Filter Positioned to the Right */}
                <div className="flex items-center justify-center sm:justify-start sm:ml-4 mt-3 sm:mt-0">
                    <label className="flex items-center gap-2 bg-white p-3 border rounded-lg shadow-md">
                        <input
                            type="checkbox"
                            checked={show_available_only}
                            onChange={(e) => set_show_available_only(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-blue-600"
                            aria-label="Show available experts only"
                        />
                        <span className="text-sm">Show available only</span>
                    </label>
                </div>
            </div>
            {loading ? (
                <div className="py-20 text-center text-gray-600">
                    <div className="flex justify-center items-center">
                        <div className="w-16 h-16 border-t-4 border-blue-600 border-dashed rounded-full animate-spin" role="status" aria-label="Loading current bids"></div>
                    </div>
                    <p>Searching experts...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8" role="list" aria-label="List of experts">
                    {filteredExperts.length > 0 ? (
                        filteredExperts.map((expert) => (
                            <Manager_view_expert
                                key={expert.User_id}
                                expert={expert}
                                refresh_expert={fetch_experts}
                                role="listitem"
                                aria-label={`Expert: ${expert.First_name} ${expert.Surname}`}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-500 mt-8" role="status" aria-live="polite">
                            No experts found matching your search criteria.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchExperts;
