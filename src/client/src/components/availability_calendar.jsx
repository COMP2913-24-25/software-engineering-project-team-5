import React, { useState } from "react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const time_options = [];

// Generates all the hours from 8am to 8pm in 24 hour format
for (let hour = 8; hour <= 20; hour++) {
    time_options.push(`${hour}:00`);
}

// The actual component
const Availability_calendar_set = ({ onSubmit }) => {
    // Allows to set the individual times for each of the days in blocks. I.e 8am to 10am and then 3pm to 4pm on monday.
    const [availability, set_availability] = useState({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
    });

    // Just updates the availabilities for the week. If it doesn't exist, initialise it.
    const handle_time_block_change = (day, index, field, value) => {
        const updated_availability = { ...availability };
        if (!updated_availability[day][index]) {
            updated_availability[day][index] = { start_time: "", end_time: "" };
        }
        updated_availability[day][index][field] = value;
        set_availability(updated_availability);
    };

    // Adds new time block for a day
    const add_time_block = (day) => {
        const updated_availability = { ...availability };
        updated_availability[day].push({ start_time: "", end_time: "" });
        set_availability(updated_availability);
    };

    // Function to remove a time block for a specific day
    const remove_time_block = (day, index) => {
        const updated_availability = { ...availability };
        // remove the time block at a certain index
        updated_availability[day].splice(index, 1);
        set_availability(updated_availability);
    };

    const handle_submit = () => {
        // Call the onSubmit prop with the availability data
        onSubmit(availability);
    };

    // Return the html needed to create the component.
    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg" role="form" aria-labelledby="availability-form-heading">
            <h2 className="text-2xl font-bold mb-6 text-center" id="availability-form-heading">
                Set Your Availability for the Coming Week
            </h2>
            {days.map((day) => (
                <div key={day} className="mb-6" role="group" aria-labelledby={`${day.toLowerCase()}-group`}>
                    <h3 className="text-xl font-semibold mb-4" id={`${day.toLowerCase()}-group`}>{day}</h3>
                    {availability[day].map((block, index) => (
                        <div key={index} className="flex items-center gap-4 mb-3" role="group" aria-label={`Time block ${index + 1} for ${day}`}>
                            <select
                                value={block.start_time}
                                onChange={(event) =>
                                    handle_time_block_change(
                                        day,
                                        index,
                                        "start_time",
                                        event.target.value
                                    )
                                }
                                className="p-2 border border-gray-300 rounded-md flex-1"
                                aria-label={`Start time for block ${index + 1}`}
                                aria-required="true"
                            >
                                <option value="">Start Time</option>
                                {time_options.map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={block.end_time}
                                onChange={(event) =>
                                    handle_time_block_change(
                                        day,
                                        index,
                                        "end_time",
                                        event.target.value
                                    )
                                }
                                className="p-2 border border-gray-300 rounded-md flex-1"
                                aria-label={`End time for block ${index + 1}`}
                                aria-required="true"
                            >
                                <option value="">End Time</option>
                                {time_options.map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => remove_time_block(day, index)}
                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                aria-label={`Remove time block ${index + 1} for ${day}`}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => add_time_block(day)}
                        className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        aria-label={`Add new time block for ${day}`}
                    >
                        Add Time Block
                    </button>
                </div>
            ))}
            <button
                onClick={handle_submit}
                className="w-full p-3 bg-green-500 text-white rounded-md hover:bg-green-600 mt-6"
                aria-label="Submit weekly availability"
            >
                Submit Availability
            </button>
        </div>
    );
};

export default Availability_calendar_set;
