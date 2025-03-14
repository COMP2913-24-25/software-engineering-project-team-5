

import React, { useState, useEffect } from "react";
import {useCSRF} from "../../App"; // Calls the user
import Search_Component from "../../components/Search_component"

const initialData = [
    // Test data for customers
    { id: 1, name: "Adam", email: "adam@example.com", level: "Manager" },
    { id: 2, name: "Ali", email: "ali@example.com", level: "Expert" },
    { id: 3, name: "Mila", email: "mile@example.com", level: "User" },
    { id: 4, name: "Kavisha", email: "kav@example.com", level: "User" },
    { id: 5, name: "Tahmid", email: "tahmid@example.com", level: "User" },
    { id: 6, name: "Hassan", email: "hassan@example.com", level: "Expert" },
];


export default function CustomerTable() {
    const [data, setData] = useState("");
    // const [sortField, setSortField] = useState(null);
    // const [sortOrder, setSortOrder] = useState("asc");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [newLevel, setNewLevel] = useState("");
    
    const { csrfToken } = useCSRF();
    const [newLevels, setNewLevels] = useState({});
    const [updated_level_list, set_updated_level_list] = useState({});
    // useEffect(() => {
    //     console.log("Updated user details:", data);
    // }, [data]);
    // Handle sorting
    // const handleSort = (field) => {
    //     const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    //     setSortField(field);
    //     setSortOrder(order);

    //     const sortedData = [...data].sort((a, b) => {
    //         if (a[field] < b[field]) return order === "asc" ? -1 : 1;
    //         if (a[field] > b[field]) return order === "asc" ? 1 : -1;
    //         return 0;
    //     });

    //     setData(sortedData);
    // };

    // Handle selecting users
    const toggleSelect = (id) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(id) ? prevSelected.filter((userId) => userId !== id) : [...prevSelected, id]
        );
    };

    const handle_search = (search_data) => {
        setData(search_data);
    }

    // Handle updating level
    const handleLevelChange = (user_Id, new_Level) => {
        setNewLevels((prevLevels) => ({
            ...prevLevels,
            [user_Id]: new_Level, // Update only the selected user's level
        }));


        set_updated_level_list((prevLevelList) => ({
            ...prevLevelList,  
            [user_Id]: new_Level,  
        }));
      };

    // useEffect(() => {
    //     console.log("Updated Level List:", updated_level_list);
    // }, [updated_level_list]);  // Dependency on updatedLevelList ensures it runs whenever it changes

// 
    const handleSave = async() => {
        if (Object.keys(updated_level_list).length === 0) return;

        const user_id = [];
        const level_of_access = [];

        for (let user_Id in updated_level_list) {
            if (updated_level_list.hasOwnProperty(user_Id)) {
                user_id.push(user_Id);  
                level_of_access.push(updated_level_list[user_Id]);  
            }
        }
    
       

        // console.log("Updated list:", updated_users);
        // console.log("Sending to backend:", JSON.stringify({ user_id : user_id, level_of_access : level_of_access })); // Debugging

        try {
            const response = await fetch("http://localhost:5000/api/update_level", {
                method : "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken, // If needed for CSRF protection
                },
                body: JSON.stringify({user_id : user_id, level_of_access : level_of_access}),
                credentials: "include",

            });

            const result = await response.json();
            console.log(" Backend response:", result);
        } catch(error) {
            console.error("Error updating levels", error);
        }
    };

    return (
        <div className="customer-table">
            <h2>Customer Information</h2>

            <Search_Component user = {true} item = {false} update_search={handle_search} />
            <table>
                <thead>
                    <tr>
                        <th>Select</th>
                        <th onClick={() => handleSort("name")}>Name </th>
                        <th onClick={() => handleSort("email")}>Email</th>
                        <th onClick={() => handleSort("level")}>Level</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((user) => (
                            <tr key={user.User_id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.User_id)}
                                        onChange={() => toggleSelect(user.User_id)}
                                    />
                                </td>
                                <td>{`${user.First_name} ${user.Middle_name} ${user.Surname}`}</td>
                                <td>{user.Email}</td>
                                <td>
                                    <select
                                        value={newLevels[user.User_id] || user.Level_of_access}
                                        onChange={(e) => handleLevelChange(user.User_id, e.target.value)}
                                    >
                                        <option value="1">User</option>
                                        <option value="2">Expert</option>
                                        <option value="3">Manager</option>
                                    </select>
                                    </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">Loading...</td>
                        </tr>
                    )}
                </tbody>
                {/* <tbody>
                    {data.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => toggleSelect(user.id)}
                                />
                            </td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.level}</td>
                        </tr>
                    ))}
                </tbody> */}
            </table>

            <div>
                <label>
                    Level:
                    <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
                        <option value="">Select</option>
                        <option value="User">User</option>
                        <option value="Expert">Expert</option>
                        <option value="Manager">Manager</option>
                    </select>
                </label>
                <button onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}
