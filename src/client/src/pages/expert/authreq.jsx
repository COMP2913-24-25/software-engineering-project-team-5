import React from "react";

const EAuthReq = () => {
  const requests = [
    { title: "Title", date: "<date given>", status: "Assign Type" },
    { title: "Title", date: "17/02/25", status: "New Request" },
    { title: "Title", date: "16/02/25", status: "Rejected" }
  ];

  return (
    <div className="container">
      <h1>Authentication Requests</h1>
      <hr />
      <div className="filter-section">
        <label>Filter</label>
        <select>
          <option value="all">All</option>
          <option value="new">New Requests</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="request-list">
        {requests.map((req, index) => (
          <div key={index} className="bid-item">
            <div className="image-placeholder"></div>
            <div className="bid-info">
              <h2>{req.title}</h2>
              <p>{req.date}</p>
              <p>{req.status}</p>
            </div>
            <button>View Request</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EAuthReq;
