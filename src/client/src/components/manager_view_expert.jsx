import React, { useState, useEffect } from "react";
import { useUser, useCSRF } from "../App"; // Calls the user
import Tag_selector from "./tags_dropdown";


const Manager_view_expert = ({ expert, refresh_expert }) => {
    const { csrfToken } = useCSRF(); // Get the CSRF token
    const [selected_tags, set_selected_tags] = useState([]);

    const handle_add_expertise = async () => {
        if (selected_tags.length === 0) return;

        try {
            const response = await fetch(`http://localhost:5000/api/add-expertise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({expertise_ids: selected_tags.map(tag => tag.value), expert_id: expert.User_id}),
                credentials: 'include',
          });

          if (response.ok){
            refresh_expert();
            set_selected_tags([]);
          } else {
            console.error("Failed to add expertise");
          }

        } catch (error) {
            console.error("Error adding expertise: ", error);
        }
    };

    const handle_remove_expertise = async () => {
        if (selected_tags.length === 0) return;

        try {
            const response = await fetch(`http://localhost:5000/api/remove-expertise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({expertise_ids: selected_tags.map(tag => tag.value), expert_id: expert.User_id}),
                credentials: 'include',
          });

          if (response.ok){
            refresh_expert();
            set_selected_tags([]);
          } else {
            console.error("Failed to remove expertise");
          }

        } catch (error) {
            console.error("Error removing expertise: ", error);
        }
    };

    return (
        <div className="p-4 border rounded shadow-md" aria-labelledby="expert-name">
        <h3 className="text-xl font-bold" id="expert-name">
        {`${expert.First_name} ${expert.Middle_name && expert.Middle_name !== "" ? expert.Middle_name + " " : ""}${expert.Surname}`}
        </h3>
            <p className="text-gray-600">{expert.Email}</p>
            <div className="mt-2">
                <p className="font-semibold">Expertise:</p>
                <ul className="list-disc list-inside" aria-live="polite">
                    {expert.Expertise.map((exp, index) => (
                        <li key={index}>{exp}</li>
                    ))}
                </ul>
            </div>
            <div className="mt-4">
                <Tag_selector selected_tags={selected_tags} set_selected_tags={set_selected_tags} is_item_tags={false} />
                <button 
                onClick={handle_add_expertise} 
                className="ml-2 p-2 bg-blue-500 text-white rounded"
                aria-label="Add expertise"
                > Add </button>
                <button onClick={handle_remove_expertise} className="ml-2 p-2 bg-red-500 text-white rounded"
                aria-label="Remove expertise"
                > Remove </button>
            </div>
        </div>
    );
};

export default Manager_view_expert;
