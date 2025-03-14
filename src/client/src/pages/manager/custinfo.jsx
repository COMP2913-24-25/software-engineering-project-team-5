
import React, { useState, useEffect } from "react";
import "./custinfo.css"; // Initial imports needed
import {useCSRF} from "../../App"; // Calls the user
import Search_Component from "../../components/Search_component"
// const initialData = [ // Test data for customers
//     { id: 1, name: "Adam", email: "adam@example.com", level: "Manager" },
//     { id: 2, name: "Ali", email: "ali@example.com", level: "Expert" },
//     { id: 3, name: "Mila", email: "mile@example.com", level: "User" },
//     { id: 4, name: "Kavisha", email: "kav@example.com", level: "User" },
//     { id: 5, name: "Tahmid", email: "tahmid@example.com", level: "User" },
//     { id: 6, name: "Hassan", email: "hassan@example.com", level: "Expert" }
// ];

export default function CustomerTable() {
    const [data, setData] = useState("");
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [newLevel, setNewLevel] = useState("");
    const { csrfToken } = useCSRF();

    useEffect(() =>{
        const get_user_details = async () => {
            try {
                const all_users_response = await fetch(
                    "http://localhost:5000/api/get_all_users",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfToken,
                        },
                        credentials: "include",
                    }
                );
                if (!all_users_response.ok) {
                    throw new Error("Failed to fetch user details");
                }
                const all_users = await all_users_response.json();
                console.log("Got users", all_users);
                setData(all_users);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        get_user_details();
    }, []);


    useEffect(() => {
        console.log("Updated user details:", data);
    }, [data]);
    // Handle sorting
    const handleSort = (field) => {
        const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortOrder(order);

        const sortedData = [...data].sort((a, b) => {
            if (a[field] < b[field]) return order === "asc" ? -1 : 1;
            if (a[field] > b[field]) return order === "asc" ? 1 : -1;
            return 0;
        });

        setData(sortedData);
    };

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
    const handleSave = () => {
        if (!newLevel) return;
        const updatedData = data.map((user) => (selectedUsers.includes(user.id) ? { ...user, level: newLevel } : user));
        setData(updatedData);
        setSelectedUsers([]); // Clear selection after update
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
                                <td>{user.Level_of_access}</td>
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
