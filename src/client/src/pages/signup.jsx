import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../App";
import config from "../../config";

const Signup = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUser(); // Access the user state
    const { csrfToken } = useCSRF(); // Access the CSRF token
    const { api_base_url } = config;

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
        // Note: '${api_base_url}/api/login' needs to be replaced with actual url once
        // the server is set up.
        const response = await fetch(`${api_base_url}/api/signup`, {
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
            // create customer for stripe
            const stripe_response = await fetch(`${api_base_url}/api/create-stripe-customer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
            });

            if (stripe_response.ok) {
                // Successful creation of Stripe customer
                const stripe_responseData = await stripe_response.json();
            } else {
                // Handle errors, e.g., user not logged in
                const errorData = await stripe_response.json();
            }

            const response = await fetch(`${api_base_url}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify({
                    email_or_username: form_data.username,
                    password: form_data.password,
                }),
            });

            const data = await response.json();

            // If response is not ok (not err code 200)
            if (!response.ok) {
                if (data.errors) {
                    set_errors(data.errors);
                } else {
                    // No errors caught by the backend, but response still not ok
                    // Potential server failure/unknown error.
                    set_errors({ general: ["Login failed. Please try again."] });
                }
            } else {
                setUser(data.user);
                navigate("/home-page");
            }

            alert("Signup successful!");
            navigate("/accountsummary");
        }
    };

    // Where the actual html for the web page is described.
    return (
        <div className="relative min-h-screen bg-gray-100 flex px-[5%] md:px-[10%] py-8 justify-center">
            <form
                onSubmit={handle_submit}
                className="absolute w-full max-w-xs px-6 space-y-4 top-10 sm:max-w-md"
                aria-labelledby="signup-heading"
                noValidate
            >
                {/* Signup Header */}
                <h2
                    id="signup-heading"
                    className="mb-2 text-2xl font-semibold text-center text-gray-800"
                >
                    Sign Up
                </h2>

                {errors.general &&
                    errors.general.map((error, index) => (
                        <div
                            key={index}
                            className="text-center text-red-600"
                            role="alert"
                            aria-live="assertive"
                        >
                            {error}
                        </div>
                    ))}

                {/* Fields for Signup Form */}
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
                ].map(({ name, type, placeholder, required }) => {
                    const inputId = `${name}-input`;
                    const errorId = `${name}-error`;
                    const hasError = errors[name] && errors[name].length > 0;

                    return (
                        <div key={name}>
                            <label htmlFor={inputId} className="sr-only">
                                {placeholder}
                            </label>
                            <input
                                id={inputId}
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                type={type}
                                name={name}
                                placeholder={placeholder}
                                value={form_data[name]}
                                onChange={handle_change}
                                required={required}
                                aria-required={required}
                                aria-invalid={hasError ? "true" : "false"}
                                aria-describedby={hasError ? errorId : undefined}
                            />
                            {errors[name] &&
                                errors[name].map((error, index) => (
                                    <p
                                        id={errorId}
                                        key={index}
                                        className="mt-1 text-sm text-red-500"
                                        role="alert"
                                        aria-live="polite"
                                    >
                                        {error}
                                    </p>
                                ))}
                        </div>
                    );
                })}

                {/* Signup Button */}
                <button
                    type="submit"
                    className="w-full py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Create new account"
                >
                    Sign Up
                </button>

                {/* Login Link */}
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="text-blue-600 hover:underline"
                            aria-label="Log in to existing account"
                        >
                            Log In
                        </a>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Signup;
