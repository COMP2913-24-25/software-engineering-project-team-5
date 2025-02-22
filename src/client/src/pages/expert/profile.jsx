import React from "react";

const Profile = () => {
  return (
    <div className="container">
      <h1>Profile</h1>
      <button className="auth-requests-btn">Authentication Requests →</button>
      
      <div className="availability-section">
        <h2>Availability - 17/02/24</h2>
        <button className="save-btn">Save</button>
        <label><input type="checkbox" /> Not Working</label>
        <label><input type="checkbox" /> Select All</label>
        
        {[
          "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ].map((day, index) => (
          <div key={index} className="day-slot">
            <label>{day}</label>
            <select><option>8:00</option></select>
            <span> - </span>
            <select><option>20:00</option></select>
            <input type="checkbox" />
          </div>
        ))}
      </div>
      
      <div className="details-section">
        <h2>Personal Details</h2>
        <label>Name: <input type="text" /></label>
        <label>Email: <input type="text" /></label>
        <label>Address: <input type="text" /></label>
      </div>
      
      <div className="expertise-section">
        <h2>Expertise</h2>
        <input type="text" placeholder="Search" />
      </div>
    </div>
  );
};

export default Profile;
