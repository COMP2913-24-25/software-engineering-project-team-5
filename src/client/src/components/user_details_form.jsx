import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../App";

const UserDetailsForm = () => {
    /*
    Allows a logged in user to view their account details and edit their personal
    details front end handles form validation, and routing to the different
    page when user isn't logged in (currently redirects to signup page).
    */

    const navigate = useNavigate();
    const { user } = useUser();

    // State variables for user details and form data
    const [user_details, set_user_details] = useState(null);
    const [form_data, set_form_data] = useState({
        First_name: "",
        Middle_name: "",
        Surname: "",
        DOB: "",
    });

    // State variables for error and success messages
    const [errors, set_errors] = useState({});
    const [error_message, set_error_message] = useState("");
    const [success_message, set_success_message] = useState("");

    // Check if user is logged in and redirect if not
    useEffect(() => {
        if (!user) {
            navigate("/signup");
        }
    }, [user, navigate]);

    // Gets user details when the component is first loaded
    useEffect(() => {
        const get_user_details = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/get-user-details",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                    }
                );

                // Waits for server response
                const data = await response.json();

                // Updates the form details to match details retrieved
                if (response.ok) {
                    set_user_details(data);
                    set_form_data({
                        First_name: data.First_name,
                        Middle_name: data.Middle_name || "",
                        Surname: data.Surname,
                        DOB: data.DOB,
                    });
                } else {
                    set_error_message(data.message);
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
                set_error_message(
                    "Failed to fetch user details. Please try again."
                );
            }
        };

        if (user) {
            get_user_details();
        }
    }, [user]);

    // Updates the form contents as the user is typing in the input field
    const handle_change = (event) => {
        const field_name = event.target.name;
        const field_value = event.target.value;

        set_form_data((previous_data) => ({
            ...previous_data,
            [field_name]: field_value,
        }));

        set_success_message("");
    };

    // Client side not null validation
    const validate_form = () => {
        const new_errors = {};

        if (!form_data.First_name.trim()) {
            new_errors.First_name = ["First name is required"];
        }

        if (!form_data.Surname.trim()) {
            new_errors.Surname = ["Surname is required"];
        }

        if (!form_data.DOB.trim()) {
            new_errors.DOB = ["Date of Birth is required"];
        }

        return new_errors;
    };

    // After clicking on submit button, the form data is sent to the server to update
    // user details
    const handle_submit = async (event) => {
        event.preventDefault();
        set_errors({});

        // Client side validation
        const validation_errors = validate_form();
        if (Object.keys(validation_errors).length > 0) {
            set_errors(validation_errors);
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/update-user-details",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form_data),
                    credentials: "include",
                }
            );

            // Waits for server response
            const data = await response.json();

            // Updates error/success messages accordingly
            if (!response.ok) {
                if (data.errors) {
                    set_errors(data.errors);
                } else {
                    set_errors({
                        general: ["Unexpected Error. Please Try Again."],
                    });
                }
            } else {
                set_success_message("Successfully updated details.");
            }
        } catch (error) {
            console.error("Error updating user details:", error);
            set_errors({
                general: [
                    "Network error. Please check your connection and try again.",
                ],
            });
        }
    };

    // If not authenticated, return null (early return)
    if (!user) {
        return null;
    }

    return (
        <div className="mx-auto bg-white shadow rounded-lg">
            {error_message && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 pl-[1em] pr-[1em] pt-[2em]">
                    {error_message}
                </div>
            )}

            {errors.general &&
                errors.general.map((error, index) => (
                    <div
                        key={index}
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 pl-[1em] pr-[1em] pt-[2em]"
                    >
                        {error}
                    </div>
                ))}

            {user_details && (
                <form onSubmit={handle_submit} className="p-[1em]">
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                            <div className="w-full">
                                <label className="block font-medium mb-1">
                                    First Name
                                </label>
                                <input
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                    type="text"
                                    name="First_name"
                                    value={form_data.First_name}
                                    onChange={handle_change}
                                    required
                                />
                                {errors.First_name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.First_name[0]}
                                    </p>
                                )}
                            </div>

                            <div className="w-full">
                                <label className="block font-medium mb-1">
                                    Middle Name
                                </label>
                                <input
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                    type="text"
                                    name="Middle_name"
                                    value={form_data.Middle_name}
                                    onChange={handle_change}
                                />
                            </div>

                            <div className="w-full">
                                <label className="block font-medium mb-1">
                                    Surname
                                </label>
                                <input
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                    type="text"
                                    name="Surname"
                                    value={form_data.Surname}
                                    onChange={handle_change}
                                    required
                                />
                                {errors.Surname && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.Surname[0]}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="w-full">
                            <label className="block font-medium mb-1">
                                Date of Birth
                            </label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                                type="date"
                                name="DOB"
                                value={form_data.DOB}
                                onChange={handle_change}
                                required
                            />
                            {errors.DOB && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.DOB[0]}
                                </p>
                            )}
                        </div>

                        <div className="">
                            <label className="block font-medium mb-1">
                                Email
                            </label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg bg-gray-100 focus:outline-none"
                                type="email"
                                value={user_details.Email}
                                readOnly
                            />
                        </div>

                        <div className="w-full">
                            <label className="block font-medium mb-1">
                                Username
                            </label>
                            <input
                                className="w-full px-3 py-2 border rounded-lg bg-gray-100 focus:outline-none"
                                type="text"
                                value={user_details.Username}
                                readOnly
                            />
                        </div>
                    </div>

                    {success_message && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mt-4">
                            {success_message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full  bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 mt-4"
                    >
                        Update Details
                    </button>
                </form>
            )}
        </div>
    );
};

export default UserDetailsForm;
