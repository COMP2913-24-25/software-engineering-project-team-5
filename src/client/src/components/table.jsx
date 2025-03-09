import React from "react";

export default function Table({ data }) {
    if (!data.length) return <p className="text-center text-gray-500">No data available.</p>;

    const headers = Object.keys(data[0]); // Extract column names from first object

    return (
        <div className="p-4 border rounded shadow-lg">
            <table className="min-w-full rounded-lg">
                <thead >
                    <tr>
                        {headers.map((header) => (
                            <th key={header} className="px-6 py-3 text-left uppercase tracking-wider">
                                {header.replace(/([A-Z])/g, " $1").trim()}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index}>
                            {headers.map((header) => (
                                <td key={header} className="px-6 py-4">
                                    {typeof row[header] === "number"
                                        ? `£${row[header].toLocaleString()}`
                                        : row[header]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

    );
}
