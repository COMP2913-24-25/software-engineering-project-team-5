import React, { useState, useEffect, createContext, UserContext } from "react";
import { useUser, useCSRF } from "../App";
import { useNavigate } from "react-router-dom";

const Login = () => {
    /*
    Allows a user to log in to the website - front end only handles simple form 
    validation, and routing to the different page upon successful login (currently
    redirects to signup page).

    Makes use of form created in forms.py so that input validation is handled server-side.
    */

    const navigate = useNavigate();
    const { setUser } = useUser();
    const { csrfToken } = useCSRF();

    // Set up the data that is in the form - should match the variable names used in forms.py
    const [form_data, set_form_data] = useState({
        email_or_username: "",
        password: "",
    });

    // Error dictionary to display errors when doing client side validation
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

    // Client side validation
    const validate_form = () => {
        const new_errors = {};

        // Checks if email/username field is empty
        if (!form_data.email_or_username.trim()) {
            new_errors.email_or_username = ["Email or Username is required"];
        }

        // Check if password field is empty
        if (!form_data.password) {
            new_errors.password = ["Password is required"];
        }

        return new_errors;
    };

    // Handle form submission - asynchronous function, as the function needs to wait
    // for the servers response before continuing
    const handle_submit = async (event) => {
        // Prevents resubmission when form is being submitted
        event.preventDefault();

        // Empties any previous errors before doing client side validation
        // e.g. errors from previous handle_submit call
        set_errors({});

        // Client-side validation
        const validation_errors = validate_form();

        // If there are any errors, add them to errors dict and stop the form submission
        if (Object.keys(validation_errors).length > 0) {
            set_errors(validation_errors);
            return;
        }

        // After client-side validation has been passed, makes a HTTP POST request to the
        // server to authenticate the user. The route/url passed has to be the same as the route
        // defined in views.py (http::/..../api/<function_name>).
        // Note: 'http://localhost:5000/api/login' needs to be repalced with actual url once
        // the server is set up.
        const response = await fetch("http://localhost:5000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            // Sends the form data to the server - can refer to views.py to see what server does
            body: JSON.stringify(form_data),
            credentials: "include",
        });

        // Waits for a response
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
        }

        // If response is ok (err code 200)
        else {
            alert("Login successful!");
            setUser(data.user);
            navigate("/home-page");
        }

    };

    // Where the actual html for the web page is described.
    return (
        <div className="relative min-h-screen bg-gray-100 flex px-4 py-8 justify-center">
            <form
                onSubmit={handle_submit}
                className="absolute top-10 w-full max-w-xs sm:max-w-md px-6 space-y-4"
            >
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">Log In</h2>

                {errors.general &&
                    errors.general.map((error, index) => (
                        <div key={index} className="text-red-600 text-center">
                            {error}
                        </div>
                    ))}

                {[
                    {
                        name: "email_or_username",
                        type: "text",
                        placeholder: "Email or Username",
                        required: true,
                    },
                    { name: "password", type: "password", placeholder: "Password", required: true },
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
                    Log In
                </button>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <a href="/signup" className="text-blue-600 hover:underline">
                            Sign Up
                        </a>
                    </p>
                </div>
            </form>
     
        </div>
    );
};

export default Login;
