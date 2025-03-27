import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App";
import config from "../../config";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const get_start_of_week = () => {
    const today = new Date();
    const day_of_week = today.getDay();
    const start_of_week = new Date(today);
    start_of_week.setDate(today.getDate() - (day_of_week === 0 ? 6 : day_of_week - 1));
    return start_of_week.toISOString().split("T")[0];
};

// The actual component
const Availability_calendar_view = ({ onSubmit }) => {
    const [availability, set_availability] = useState({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
    });

    const { user } = useUser();
    const { csrfToken } = useCSRF();
    const { api_base_url } = config;

    useEffect(() => {
        const fetch_availabilities = async () => {
            const week_start_date = get_start_of_week();
            try {
                const response = await fetch(`${api_base_url}/api/get-availabilities`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    body: JSON.stringify({ week_start_date: week_start_date }),
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    const formatted_availability = format_availability(data);
                    set_availability(formatted_availability);
                } else {
                    console.error("Failed to fetch availabilities");
                }
            } catch (error) {
                console.error("Error fetching availabilities:", error);
            }
        };

        fetch_availabilities();
    }, [user.User_id, csrfToken]);

    const format_availability = (data) => {
        const formatted_data = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: [],
        };

        data.forEach((avail) => {
            const day = days[avail.Day_of_week - 1];
            formatted_data[day].push(`${avail.Start_time} - ${avail.End_time}`);
        });

        return formatted_data;
    };

    // Return the html needed to create the component.
    return (
        <div className="p-6 bg-white shadow rounded-lg">
            {days.map((day) => (
                <div key={day} className="mb-6" role="listitem" aria-label={`Availability for ${day}`}>
                    <h3 className="text-xl font-semibold mb-4" id={`${day.toLowerCase()}-heading`}>{day}</h3>
                    {availability[day].length > 0 ? (
                        <ul role="list" aria-labelledby={`${day.toLowerCase()}-heading`}>
                        {availability[day].map((block, index) => (
                            <li 
                                key={index} 
                                className="flex items-center gap-4 mb-3"
                                role="listitem"
                                aria-label={`Available from ${block}`}
                            >
                                <span>{block}</span>
                            </li>
                        ))}
                    </ul>
                    ) : (
                        <p aria-live="polite">You are not working on this day.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Availability_calendar_view;
