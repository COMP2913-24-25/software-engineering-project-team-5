import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../../App"; // Calls the user
import Search_Component from "../../components/Search_component";
import { useNavigate } from "react-router-dom";
import config from "../../../config";

export default function CustomerTable() {
    const [data, set_Data] = useState("");
    const [selected_users, setselected_users] = useState([]);
    const { csrfToken } = useCSRF();
    const [new_levels, setnew_levels] = useState({});
    const [updated_level_list, set_updated_level_list] = useState({});
    const [bulk_level, setbulk_level] = useState(""); // Stores the selected bulk level

    // const [refreshTrigger, setRefreshTrigger] = useState(false);

    const { user } = useUser();
    const { api_base_url } = config;

    // console.log("Data List:", data);
    const navigate = useNavigate();

    // Handle selecting users
    const toggle_select = (id) => {
        setselected_users((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((userId) => userId !== id)
                : [...prevSelected, id]
        );
    };

    const handle_search = (search_data) => {
        set_Data(search_data);
    };

    // Handle updating level
    const handle_level_change = (user_Id, new_Level) => {
        setnew_levels((prevLevels) => ({
            ...prevLevels,
            [user_Id]: new_Level, // Update only the selected user's level
        }));

        set_updated_level_list((prevLevelList) => ({
            ...prevLevelList,
            [user_Id]: new_Level,
        }));
    };

    const handle_bulk_level_change = (e) => {
        setbulk_level(e.target.value);
    };

    const apply_bulk_level = () => {
        if (!bulk_level) return;

        const updatedLevels = { ...new_levels };
        const updatedList = { ...updated_level_list };

        selected_users.forEach((userId) => {
            updatedLevels[userId] = bulk_level;
            updatedList[userId] = bulk_level;
        });

        setnew_levels(updatedLevels);
        set_updated_level_list(updatedList);
    };

    const handle_save = async () => {
        if (Object.keys(updated_level_list).length === 0) return;

        const user_id = [];
        const level_of_access = [];

        for (let user_Id in updated_level_list) {
            if (updated_level_list.hasOwnProperty(user_Id)) {
                user_id.push(user_Id);
                level_of_access.push(updated_level_list[user_Id]);
            }
        }

        try {
            const response = await fetch(`${api_base_url}/api/update_level`, {
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
            // setRefreshTrigger(!refreshTrigger);
            alert("User access levels have been updated successfully!");

            // Clear updated list and trigger re-fetch
            set_updated_level_list({});
        } catch (error) {
            console.error("Error updating levels", error);
        }
    };

    useEffect(() => {
        if (!(user?.level_of_access === 3)) {
            navigate("/invalid-access-rights");
        }
    }, [navigate, user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
            <div className="text-center mb-8">
                <h1
                    id="customer-info-heading"
                    className="text-2xl font-semibold text-center text-gray-800 mb-4"
                    aria-label="Customer Information"
                >
                    Customer Information
                </h1>
                <p className="text-xl text-gray-500 mt-2" aria-live="polite">
                    Search and manage customer details.
                </p>
            </div>
            
            <div className="mb-4 flex items-center justify-start gap-4">
                <h3 className="text-lg font-semibold" id="search-users-heading">
                    Search for Users
                </h3>
                <Search_Component
                    user={true}
                    item={false}
                    update_search={handle_search}
                    aria-labelledby="search-users-heading"
                    aria-label="Search component to find users"
                />
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">Change level for selected users:</span>
                    <select
                        className="border rounded p-1"
                        value={bulk_level}
                        onChange={handle_bulk_level_change}
                    >
                        <option value="">Select Level</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                    <button
                        onClick={apply_bulk_level}
                        className="bg-blue-500 text-white px-4 py-1 rounded-lg hover:bg-blue-600 transition"
                    >
                        Confirm Bulk Change
                    </button>
                </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={handle_save}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition w-full sm:w-auto"
                    aria-label="Save selected users and their access levels"
                >
                    Save
                </button>
            </div>
            </div>

            <div className="overflow-auto">
                <table
                    className="min-w-full bg-white border border-gray-300 rounded-lg text-sm 
            sm:text-base"
                    role="table"
                    aria-describedby="customer-info-heading"
                >
                    <thead>
                        <tr className="bg-gray-100 text-left text-xs sm:text-sm">
                            <th className="p-2 sm:p-3 border text-center" scope="col">
                                Select
                            </th>
                            <th className="p-2 sm:p-3 border" scope="col">
                                Name
                            </th>
                            <th className="p-2 sm:p-3 border" scope="col">
                                Email
                            </th>
                            <th className="p-2 sm:p-3 border" scope="col">
                                Level
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data
                                .filter((user_display) => user_display.User_id !== user.user_id)
                                .map((user_display) => (
                                    <tr
                                        key={user_display.User_id}
                                        className="border-b hover:bg-gray-50"
                                        role="row"
                                    >
                                        <td className="p-2 sm:p-3 border text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected_users.includes(
                                                    user_display.User_id
                                                )}
                                                onChange={() => toggle_select(user_display.User_id)}
                                                aria-label={`Select user ${user_display.First_name} ${user_display.Surname}`}
                                            />
                                        </td>
                                        <td className="p-2 sm:p-3 border">{`${user_display.First_name} ${user_display.Middle_name} ${user_display.Surname}`}</td>
                                        <td className="p-2 sm:p-3 border">{user_display.Email}</td>
                                        <td className="p-2 sm:p-3 border">
                                            <select
                                                id={`level-select-${user_display.User_id}`}
                                                className="border rounded p-1 w-full sm:w-auto"
                                                value={
                                                    new_levels[user_display.User_id] ||
                                                    user_display.Level_of_access
                                                }
                                                onChange={(e) =>
                                                    handle_level_change(
                                                        user_display.User_id,
                                                        e.target.value
                                                    )
                                                }
                                                aria-label={`Select access level for ${user_display.First_name}`}
                                            >
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="p-3 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
        </div>
    );
}
