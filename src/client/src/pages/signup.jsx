import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../App";

const Signup = () => {
    const navigate = useNavigate();
    const { user } = useUser(); // Access the user state
    const { csrfToken } = useCSRF(); // Access the CSRF token

    // Set up form data
    const [form_data, set_form_data] = useState({
        first_name: "",
        middle_name: "",
        surname: "",
        DOB: "",
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const [errors, set_errors] = useState({});

    // Function to update the fromData as the user types in the input field
    const handle_change = (event) => {
        // Stores the name and value of the input field that is being edited
        const field_name = event.target.name;
        const field_value = event.target.value;

        // Updates the form_data to reflect the new changes
        // Similar to string concatenation
        set_form_data((previous_data) => ({
            ...previous_data, // Keep existing form data
            [field_name]: field_value, // Adds on the new field_value to the end
        }));
    };

    // Client Side Validation
    const validate_form = () => {
        const new_errors = {};

        if (!form_data.first_name.trim()) {
            new_errors.first_name = ["First name is required"];
        }

        if (!form_data.surname.trim()) {
            new_errors.surname = ["Surname is required"];
        }

        if (!form_data.username.trim()) {
            new_errors.username = ["Username is required"];
        }

        if (!form_data.email.trim()) {
            new_errors.email = ["Email is required"];
        } else if (!/\S+@\S+\.\S+/.test(form_data.email)) {
            new_errors.email = ["Please enter a valid email address"];
        }

        if (!form_data.password) {
            new_errors.password = ["Password is required"];
        }

        if (form_data.password !== form_data.password_confirmation) {
            new_errors.password_confirmation = ["Passwords do not match"];
        }

        if (!form_data.DOB) {
            new_errors.DOB = ["Date of birth is required"];
        }

        return new_errors;
    };

    // Handle form submission - asynchronous function, as the function needs to wait
    // for the servers response before continuing
    const handle_submit = async (event) => {
        event.preventDefault();
        set_errors({});

        // Client-side validation
        const validation_errors = validate_form();

        // Error retrieval from validation
        if (Object.keys(validation_errors).length > 0) {
            set_errors(validation_errors);
            return;
        }

        // After client-side validation has been passed, makes a HTTP POST request to the
        // server to authenticate the user
        // Note: 'http://localhost:5000/api/login' needs to be replaced with actual url once
        // the server is set up.
        const response = await fetch("http://localhost:5000/api/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            credentials: "include",
            body: JSON.stringify(form_data),
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.errors) {
                set_errors(data.errors);
            } else {
                set_errors({ general: ["Signup failed. Please try again."] });
            }
        } else {
            alert("Signup successful!");
            navigate("/accountsummary");
            // create customer for stripe
            const stripe_response = await fetch(
                "http://localhost:5000/api/create-stripe-customer",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrfToken,
                    },
                    credentials: "include",
                }
            );
            if (stripe_response.ok) {
                // Successful creation of Stripe customer
                const stripe_responseData = await stripe_response.json();
                console.log(stripe_responseData.message); // Log the success message
                alert("Customer creation successful!");
            } else {
                // Handle errors, e.g., user not logged in
                const errorData = await stripe_response.json();
                console.log(errorData.message); // Log the error message
            }
        }
    };

    // Where the actual html for the web page is described.
    return (
        <div className="relative min-h-screen bg-gray-100 flex px-[5%] md:px-[10%] py-8 justify-center">
            <form
                onSubmit={handle_submit}
                className="absolute top-10 w-full max-w-xs sm:max-w-md px-6 space-y-4"
            >
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">Sign Up</h2>

                {errors.general &&
                    errors.general.map((error, index) => (
                        <div key={index} className="text-red-600 text-center">
                            {error}
                        </div>
                    ))}

                {[
                    { name: "first_name", type: "text", placeholder: "First Name", required: true },
                    { name: "middle_name", type: "text", placeholder: "Middle Name" },
                    { name: "surname", type: "text", placeholder: "Surname", required: true },
                    { name: "DOB", type: "date", required: true },
                    { name: "username", type: "text", placeholder: "Username", required: true },
                    { name: "email", type: "email", placeholder: "Email", required: true },
                    { name: "password", type: "password", placeholder: "Password", required: true },
                    {
                        name: "password_confirmation",
                        type: "password",
                        placeholder: "Confirm Password",
                        required: true,
                    },
                ].map(({ name, type, placeholder, required }) => (
                    <div key={name}>
                        <input
                            className="bg-white w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            type={type}
                            name={name}
                            placeholder={placeholder}
                            value={form_data[name]}
                            onChange={handle_change}
                            required={required}
                        />
                        {errors[name] &&
                            errors[name].map((error, index) => (
                                <p key={index} className="text-red-500 text-sm mt-1">
                                    {error}
                                </p>
                            ))}
                    </div>
                ))}

                <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Sign Up
                </button>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <a href="/login" className="text-blue-600 hover:underline">
                            Log In
                        </a>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Signup;
