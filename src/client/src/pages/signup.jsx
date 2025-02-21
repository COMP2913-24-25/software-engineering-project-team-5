import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
    const navigate = useNavigate();

    // Set up form data
    const [formData, setFormData] = useState({
        first_name: "",
        middle_name: "",
        surname: "",
        DOB: "",
        username: "",
        email: "",
        password: "",
        passwordConfirmation: "",
    });

    const [errors, setErrors] = useState({});

    // Function to update the fromData as the user types in the input field
    const handleChange = (event) => {
        // Stores the name and value of the input field that is being edited 
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
    
        // Updates the formData to reflect the new changes
        // Similar to string concatenation
        setFormData((previousData) => ({
            ...previousData,            // Keep existing form data
            [fieldName]: fieldValue     // Adds on the new fieldValue to the end
        }));
    
    };

    // Client Side Validation
    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = ["First name is required"];
        }

        if (!formData.surname.trim()) {
            newErrors.surname = ["Surname is required"];
        }

        if (!formData.username.trim()) {
            newErrors.username = ["Username is required"];
        }

        if (!formData.email.trim()) {
            newErrors.email = ["Email is required"];
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = ["Please enter a valid email address"];
        }

        if (!formData.password) {
            newErrors.password = ["Password is required"];
        }

        if (formData.password !== formData.passwordConfirmation) {
            newErrors.passwordConfirmation = ["Passwords do not match"];
        }

        if (!formData.DOB) {
            newErrors.DOB = ["Date of birth is required"];
        }

        return newErrors;
    };

    // Handle form submission - asynchronous function, as the function needs to wait
    // for the servers response before continuing
    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({});

        // Client-side validation
        const validationErrors = validateForm();

        // Error retrieval from validation
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        // After client-side validation has been passed, makes a HTTP POST request to the 
        // server to authenticate the user
        // Note: 'http://localhost:5000/api/login' needs to be repalced with actual url once
        // the server is set up.
        const response = await fetch('http://localhost:5000/api/signup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.errors) {
                setErrors(data.errors);
            } 
            else {
                setErrors({ general: ["Signup failed. Please try again."] });
            }
        } else {
            alert("Signup successful!");
            navigate('/login');
        }
    };
    
    // Where the actual html for the web page is described.
    return (
        <div className="container">
            <h2>Sign Up</h2>
            {errors.general && errors.general.map((error, index) => (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            ))}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input className="form-control" type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required/>
                    {errors.first_name && errors.first_name.map((error, index) => (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    ))}
                </div>

                <div>
                    <input className="form-control" type="text" name="middle_name" placeholder="Middle Name" value={formData.middle_name} onChange={handleChange}/>
                    {errors.middle_name && errors.middle_name.map((error, index) => (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    ))}
                </div>

                <div>
                    <input className="form-control" type="text" name="surname" placeholder="Surname" value={formData.surname} onChange={handleChange} required/>
                    {errors.surname && errors.surname.map((error, index) => (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    ))}
                </div>

                <div>
                    <input className="form-control" type="date" name="DOB" value={formData.DOB} onChange={handleChange} required/>
                    {errors.DOB && errors.DOB.map((error, index) => (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    ))}
                </div>

                <div>
                    <input className="form-control" type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required/>
                    {errors.username && errors.username.map((error, index) => (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    ))}
                </div>

                <div>
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="form-control" required/>
                    {errors.email && errors.email.map((error, index) => (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    ))}
                </div>

                <div>
                    <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="form-control" required/>
                    {errors.password && errors.password.map((error, index) => (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    ))}
                </div>

                <div>
                    <input type="password" name="passwordConfirmation" placeholder="Confirm Password" value={formData.passwordConfirmation} onChange={handleChange} className="form-control" required/>
                    {errors.passwordConfirmation && errors.passwordConfirmation.map((error, index) => (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                    ))}
                </div>

                <button type="submit"  className="btn btn-primary">"Sign Up"</button>
            </form>
        </div>
    );
};

export default Signup;