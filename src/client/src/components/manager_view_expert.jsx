import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useCSRF } from "../App"; // Calls the user
import Tag_selector from "./tags_dropdown";


const Manager_view_expert = ({ expert }) => {
    const navigate = useNavigate();
    const { csrfToken } = useCSRF(); // Get the CSRF token
    const [selected_tags, set_selected_tags] = useState([]);

    const handle_add_expertise = async () => {
        if (selected_tags.length === 0) return;

        try {
            const response = await fetch(`http://localhost:5000/api/add-expertise/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({expertise_ids: selected_tags.map(tag => tag.value), expert_id: expert.User_id}),
                credentials: 'include',
          });

          if (response.ok){
            alert("Expertise added successfully");
            set_new_expertise([]);
          } else {
            console.error("Failed to add expertise");
          }

        } catch (error) {
            console.error("Error adding expertise: ", error);
        }
    };

    return (
        <div className="p-4 border rounded shadow-md">
            <h3 className="text-xl font-bold">{`${expert.First_name} ${expert.Surname}`}</h3>
            <p className="text-gray-600">{expert.Email}</p>
            <div className="mt-2">
                <p className="font-semibold">Expertise:</p>
                <ul className="list-disc list-inside">
                    {expert.Expertise.map((exp, index) => (
                        <li key={index}>{exp}</li>
                    ))}
                </ul>
            </div>
            <div className="mt-4">
                <Tag_selector selected_tags={selected_tags} set_selected_tags={set_selected_tags} />
                <button
                    onClick={handle_add_expertise}
                    className="ml-2 p-2 bg-blue-500 text-white rounded"
                >
                    Add
                </button>
            </div>
        </div>
    );
};

export default Manager_view_expert;
