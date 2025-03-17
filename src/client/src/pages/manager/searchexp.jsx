import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../../App";
import Manager_view_expert from "../../components/manager_view_expert";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const get_start_of_week = () => {
    const today = new Date();
    const day_of_week = today.getDay();
    const start_of_week = new Date(today);
    start_of_week.setDate(today.getDate() - (day_of_week === 0 ? 6 : day_of_week - 1));
    return start_of_week.toISOString().split('T')[0];
}

const get_current_day = () => {
    const today = new Date();
    const day_of_week = today.getDay();

    if (day_of_week === 0){
        return 7;
    }

    return day_of_week;
}

const SearchExperts = () => {
    // In this component I want to get a list of all the experts and their data.
    // Using the data I get from the backend, create manager_view_expert components of each expert.
    // Allow filtering based on their name and tags
    // Allow the manager to add tags to users, but that will be handled in the manager_view_expert component.
    
    const {user} = useUser();
    const {csrfToken} = useCSRF();
    const [experts, set_experts] = useState([]);
    const [search, set_search] = useState("");
    const [show_available_only, set_show_available_only] = useState(false);

    const fetch_experts = async () => {
        const week_start_date = get_start_of_week();
        try {
            const response = await fetch('http://localhost:5000/api/get-experts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({week_start_date: week_start_date, current_day: get_current_day()}),
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                set_experts(data);
                console.log(data);
            } else {
                console.error("Failed to fetch experts");
            }
        }catch (error) {
            console.error("Error fetching experts:", error);
        }
    };

    useEffect(() => {
        fetch_experts();
    }, [user.User_id, csrfToken]);

    // Search filter handling
    const filteredExperts = experts.filter((expert) =>{
        const full_name = `${expert.First_name} ${expert.Middle_name || ''} ${expert.Surname}`.replace(/\s+/g, ' ').trim().toLowerCase();
        const expertise = (expert.Expertise || []).join(" ").toLowerCase();
        const search_term = search.toLowerCase();
        const matches_search =  full_name.includes(search_term) || expertise.includes(search_term);
        const matches_availability = !show_available_only || expert.is_available;
        return matches_search && matches_availability;
    });


    useEffect(() => {
        if (!(user?.level_of_access === 3)) {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div className="p-">
            <h2 className="text-2xl font-bold mb-4">Search Experts</h2>

            <div className="mb-4">
                <input type="text" className="p-2 border rounded" placeholder="Search by name or expertise" value={search} onChange={(e) => set_search(e.target.value)} />

            </div>
            <label className="flex items-center gap-2">
                    <input type="checkbox" checked={show_available_only} onChange={(e) => set_show_available_only(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-600"/>
                    <span>Show available only</span>
                </label>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExperts.map((expert) => (
                    <Manager_view_expert key={expert.User_id} expert={expert} refresh_expert={fetch_experts}/>
                ))}
            </div>

        </div>
    );
};

export default SearchExperts;