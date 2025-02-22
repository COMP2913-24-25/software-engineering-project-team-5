import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./profits.css"; // For styling

const initialData = [
    { week: "10/02/25", totalSold: 1000, siteProfit: 10, expertProfit: 40 },
    { week: "17/02/25", totalSold: 1200, siteProfit: 15, expertProfit: 50 },
    { week: "24/02/25", totalSold: 900, siteProfit: 8, expertProfit: 35 },
    { week: "03/03/25", totalSold: 700, siteProfit: 7, expertProfit: 30 },
    { week: "10/03/25", totalSold: 1100, siteProfit: 11, expertProfit: 40 },
];

export default function WeeklyProfits() {
    const [data] = useState(initialData);

    return (
        <div className="weekly-profits">
            <h2>Weekly Profits</h2>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalSold" stroke="#8884d8" name="Total Sold (£)" />
                    <Line type="monotone" dataKey="siteProfit" stroke="#82ca9d" name="Profit for Site (£)" />
                    <Line type="monotone" dataKey="expertProfit" stroke="#ffc658" name="Profit for Experts (£)" />
                </LineChart>
            </ResponsiveContainer>

            {/* Table */}
            <table>
                <thead>
                    <tr>
                        <th>Week</th>
                        <th>Total Sold (£)</th>
                        <th>Profit for Site (£)</th>
                        <th>Profit for Experts (£)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            <td>{row.week}</td>
                            <td>£{row.totalSold}</td>
                            <td>£{row.siteProfit}</td>
                            <td>£{row.expertProfit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
