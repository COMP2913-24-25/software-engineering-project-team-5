import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../../App"; // Calls the user
import Search_Component from "../../components/Search_component";
import { useNavigate } from "react-router-dom";

// const initialData = [
//     // Test data for customers
//     { id: 1, name: "Adam", email: "adam@example.com", level: "Manager" },
//     { id: 2, name: "Ali", email: "ali@example.com", level: "Expert" },
//     { id: 3, name: "Mila", email: "mile@example.com", level: "User" },
//     { id: 4, name: "Kavisha", email: "kav@example.com", level: "User" },
//     { id: 5, name: "Tahmid", email: "tahmid@example.com", level: "User" },
//     { id: 6, name: "Hassan", email: "hassan@example.com", level: "Expert" },
// ];

export default function CustomerTable() {
    const [data, setData] = useState("");
    // const [filtered_data, set_filtered_data] = useState(""); // stores all users but managers to display on page
    // const [sortField, setSortField] = useState(null);
    // const [sortOrder, setSortOrder] = useState("asc");
    const [selectedUsers, setSelectedUsers] = useState([]);
    // const [newLevel, setNewLevel] = useState("");

    const { csrfToken } = useCSRF();
    const [newLevels, setNewLevels] = useState({});
    const [updated_level_list, set_updated_level_list] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    const { user } = useUser();
    const navigate = useNavigate();

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
            prevSelected.includes(id)
                ? prevSelected.filter((userId) => userId !== id)
                : [...prevSelected, id]
        );
    };

    const handle_search = (search_data) => {
        setData(search_data);
        // setData(search_data.filter(user => user.Level_of_access !== 3)); // Exclude managers    
        };

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
    const handleSave = async () => {
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
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken, // If needed for CSRF protection
                },
                body: JSON.stringify({ user_id: user_id, level_of_access: level_of_access }),
                credentials: "include",
            });

            const result = await response.json();
            console.log(" Backend response:", result);
            console.log("Refresh before", refreshTrigger)
            setRefreshTrigger(!refreshTrigger);
            console.log("Refresh after", refreshTrigger)
            alert("User access levels have been updated successfully! ✅");

            // if (result.ok)
            // {
            //     alert("User access levels have been updated successfully! ✅");
            // }

            // Clear updated list and trigger re-fetch
            set_updated_level_list({});
           
        } catch (error) {
            console.error("Error updating levels", error);
        }
    };

    useEffect(() => {
        // Call the function that fetches user data again
        console.log("Re-rendering");
        // setData((prevData) => prevData.filter(user => user.Level_of_access !== 3));
        }, [refreshTrigger]); 

    useEffect(() => {
        if (!(user?.level_of_access === 3)) {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Customer Information</h2>
            
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Search for Users</h3>
                <Search_Component user={true} item={false} update_search={handle_search} />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="p-3 border">Select</th>
                            <th className="p-3 border">Name</th>
                            <th className="p-3 border">Email</th>
                            <th className="p-3 border">Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.filter(user => user.Level_of_access !== 3).map((user) => (
                                <tr key={user.User_id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 border text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.User_id)}
                                            onChange={() => toggleSelect(user.User_id)}
                                        />
                                    </td>
                                    <td className="p-3 border">{`${user.First_name} ${user.Middle_name} ${user.Surname}`}</td>
                                    <td className="p-3 border">{user.Email}</td>
                                    <td className="p-3 border">
                                        <select
                                            className="border rounded p-1"
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
                                <td colSpan="4" className="p-3 text-center text-gray-500">Loading...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center gap-4">
                <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Save
                </button>
            </div>
        </div>
    );
}