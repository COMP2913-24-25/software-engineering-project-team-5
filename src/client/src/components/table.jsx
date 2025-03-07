import React from "react";

export default function Table({ data }) {
    if (!data.length) return <p>No data available.</p>;

    const headers = Object.keys(data[0]); // Extract column names from first object

    return (
        <table>
            <thead>
                <tr>
                    {headers.map((header) => (
                        <th key={header}>{header.replace(/([A-Z])/g, " $1")}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, index) => (
                    <tr key={index}>
                        {headers.map((header) => (
                            <td key={header}>
                                {typeof row[header] === "number" ? `£${row[header].toLocaleString()}` : row[header]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
