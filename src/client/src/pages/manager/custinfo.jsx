import React, { useState } from "react";
import "./custinfo.css";

const initialData = [
    { id: 1, name: "Alice", email: "alice@example.com", level: "User" },
    { id: 2, name: "Bob", email: "bob@example.com", level: "Expert" },
    { id: 3, name: "Charlie", email: "charlie@example.com", level: "Manager" },
    { id: 4, name: "David", email: "david@example.com", level: "User" },
];

export default function CustomerTable() {
    const [data, setData] = useState(initialData);
    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [newLevel, setNewLevel] = useState("");

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

    // Handle updating level
    const handleSave = () => {
        if (!newLevel) return;
        const updatedData = data.map((user) =>
            selectedUsers.includes(user.id) ? { ...user, level: newLevel } : user
        );
        setData(updatedData);
        setSelectedUsers([]); // Clear selection after update
    };

    return (
        <div className="customer-table">
            <h2>Customer Information</h2>
            <table>
                <thead>
                    <tr>
                        <th>Select</th>
                        <th onClick={() => handleSort("name")}>Name ▼</th>
                        <th onClick={() => handleSort("email")}>Email ▼</th>
                        <th onClick={() => handleSort("level")}>Level ▼</th>
                    </tr>
                </thead>
                <tbody>
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
                </tbody>
            </table>

            {/* Level Selection & Save Button */}
            <div className="level-update">
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
