import React, { useState } from "react";
import { useUser, useCSRF } from "../App"; // Access the user

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const get_start_of_week = () => {
    const today = new Date();
    const day_of_week = today.getDay();
    const start_of_week = new Date(today);
    start_of_week.setDate(today.getDate() - (day_of_week === 0 ? 6 : day_of_week - 1));
    return start_of_week.toISOString().split('T')[0];
}

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

    const user = useUser();
    const csrfToken = useCSRF();

    useEffect(() => {
        const fetch_availabilities = async () => {
            const week_start_date = get_start_of_week();
            try {
                const response = await fetch('/api/get-availabilities', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                    },
                    body: JSON.stringify({week_start_date: week_start_date}),
                });
                if (response.ok) {
                    const data = await response.json();
                    const formatted_availability = format_availability(data);
                    set_availability(formatted_availability);
                } else {
                    console.error("Failed to fetch availabilities");
                }
            }catch (error) {
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
            const day = days[avail.day_of_week - 1];
            formatted_data[day].push(`${avail.Start_time} - ${avail.End_time}`);
        })
    }

    // Return the html needed to create the component.
    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">View Your Availability for this Week</h2>
            {days.map((day) => (
                <div key={day} className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">{day}</h3>
                    {availability[day].length > 0 ? (
                        availability[day].map((block, index) => (
                            <div key={index} className="flex items-center gap-4 mb-3">
                                <span>{block}</span>
                            </div>
                        ))
                    ) : (
                        <p>You are not working on this day.</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default Availability_calendar_view;