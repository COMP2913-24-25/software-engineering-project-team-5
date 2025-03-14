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
             const stripe_response = await fetch("http://localhost:5000/api/create-stripe-customer", {
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
        <div className="container">
            <h2>Sign Up</h2>
            {errors.general &&
                errors.general.map((error) => (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                ))}

            <form onSubmit={handle_submit} className="space-y-4">
                <div>
                    <input
                        className="form-control"
                        type="text"
                        name="first_name"
                        placeholder="First Name"
                        value={form_data.first_name}
                        onChange={handle_change}
                        required
                    />
                    {errors.first_name &&
                        errors.first_name.map((error) => (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                <div>
                    <input
                        className="form-control"
                        type="text"
                        name="middle_name"
                        placeholder="Middle Name"
                        value={form_data.middle_name}
                        onChange={handle_change}
                    />
                    {errors.middle_name &&
                        errors.middle_name.map((error) => (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                <div>
                    <input
                        className="form-control"
                        type="text"
                        name="surname"
                        placeholder="Surname"
                        value={form_data.surname}
                        onChange={handle_change}
                        required
                    />
                    {errors.surname &&
                        errors.surname.map((error) => (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                <div>
                    <input
                        className="form-control"
                        type="date"
                        name="DOB"
                        value={form_data.DOB}
                        onChange={handle_change}
                        required
                    />
                    {errors.DOB &&
                        errors.DOB.map((error) => (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                <div>
                    <input
                        className="form-control"
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={form_data.username}
                        onChange={handle_change}
                        required
                    />
                    {errors.username &&
                        errors.username.map((error) => (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                <div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form_data.email}
                        onChange={handle_change}
                        className="form-control"
                        required
                    />
                    {errors.email &&
                        errors.email.map((error) => (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                <div>
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form_data.password}
                        onChange={handle_change}
                        className="form-control"
                        required
                    />
                    {errors.password &&
                        errors.password.map((error) => (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                <div>
                    <input
                        type="password"
                        name="password_confirmation"
                        placeholder="Confirm Password"
                        value={form_data.password_confirmation}
                        onChange={handle_change}
                        className="form-control"
                        required
                    />
                    {errors.password_confirmation &&
                        errors.password_confirmation.map((error) => (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        ))}
                </div>

                <button type="submit" className="btn btn-primary">
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default Signup;
