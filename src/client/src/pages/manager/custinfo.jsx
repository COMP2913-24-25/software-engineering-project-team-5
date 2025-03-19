import React, { useState, useEffect } from "react";
import { useCSRF, useUser } from "../../App"; // Calls the user
import Search_Component from "../../components/Search_component";
import { useNavigate } from "react-router-dom";


export default function CustomerTable() {
    const [data, setData] = useState("");;
    const [selectedUsers, setSelectedUsers] = useState([]);

    const { csrfToken } = useCSRF();
    const [newLevels, setNewLevels] = useState({});
    const [updated_level_list, set_updated_level_list] = useState({});
    const [refreshTrigger, setRefreshTrigger] = useState(false);

    const { user } = useUser();


console.log("Data List:", data);
    const navigate = useNavigate();

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
            // setRefreshTrigger(!refreshTrigger);
            alert("User access levels have been updated successfully! ✅");

            // Clear updated list and trigger re-fetch
            set_updated_level_list({});
           
        } catch (error) {
            console.error("Error updating levels", error);
        }

       
    };
//Re render only needed if managers are not to be displayed
    // useEffect(() => {
    //     console.log("Re-rendering");
    //     handle_search("");
    //     // setData((prevData) => prevData.filter(user => user.Level_of_access !== 3));
    //     }, []); 

    

    useEffect(() => {
        if (!(user?.level_of_access === 3)) {
            navigate("/invalid-access-rights");
        }
    }, [user]);

    return (
        <div className="relative min-h-screen bg-gray-100 px-[5%] md:px-[10%] py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
              Customer Information
            </h1>
            <p className="text-xl text-gray-500 mt-2">Search and manage customer details.</p>
          </div>
      
          <div className="mb-4 flex items-center justify-start gap-4">
            <h3 className="text-lg font-semibold">Search for Users</h3>
            <Search_Component user={true} item={false} update_search={handle_search} />
          </div>
      
          <div className="overflow-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100 text-left text-xs sm:text-sm">
                  <th className="p-2 sm:p-3 border text-center">Select</th>
                  <th className="p-2 sm:p-3 border">Name</th>
                  <th className="p-2 sm:p-3 border">Email</th>
                  <th className="p-2 sm:p-3 border">Level</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.filter(user_display => user_display.User_id !== user.user_id).map((user_display) => (
                    <tr key={user_display.User_id} className="border-b hover:bg-gray-50">
                      <td className="p-2 sm:p-3 border text-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user_display.User_id)}
                          onChange={() => toggleSelect(user_display.User_id)}
                        />
                      </td>
                      <td className="p-2 sm:p-3 border">{`${user_display.First_name} ${user_display.Middle_name} ${user_display.Surname}`}</td>
                      <td className="p-2 sm:p-3 border">{user_display.Email}</td>
                      <td className="p-2 sm:p-3 border">
                        <select
                          className="border rounded p-1 w-full sm:w-auto"
                          value={newLevels[user_display.User_id] || user_display.Level_of_access}
                          onChange={(e) => handleLevelChange(user_display.User_id, e.target.value)}
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
                    <td colSpan="4" className="p-3 text-center text-gray-500">Loading...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition w-full sm:w-auto"
            >
              Save
            </button>
          </div>
        </div>
      );
      
}