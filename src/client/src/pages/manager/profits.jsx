import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./profits.css"; // Initial imports needed

const initialData = [ // Test data
    { week: "10/02/25", sold: 1000, sProfit: 100, eProfit: 400 },
    { week: "17/02/25", sold: 1200, sProfit: 150, eProfit: 500 },
    { week: "24/02/25", sold: 900, sProfit: 80, eProfit: 350 },
    { week: "03/03/25", sold: 700, sProfit: 70, eProfit: 300 },
    { week: "10/03/25", sold: 1100, sProfit: 110, eProfit: 400 },
];

export default function WeeklyProfits() {
    const [data] = useState(initialData);

    return (
        <div className="weekly-profits">
            <h2>Weekly Profits</h2>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sold" stroke="red" name="Total Sold (£)" />
                    <Line type="monotone" dataKey="sProfit" stroke="blue" name="Profit for Site (£)" />
                    <Line type="monotone" dataKey="eProfit" stroke="green" name="Profit for Experts (£)" />
                </LineChart>
            </ResponsiveContainer>


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
                            <td>£{row.sold}</td>
                            <td>£{row.sProfit}</td>
                            <td>£{row.eProfit}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
