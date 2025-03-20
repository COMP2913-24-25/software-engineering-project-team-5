import io from "socket.io-client";

let socket = null;
let activeConnections = 0;

export const get_socket = () => {
    // Only initialize if not already done
    if (!socket) {
        socket = io("http://localhost:5000", {
            withCredentials: true,
            maxHttpBufferSize: 50 * 1024 * 1024, // Sets payload size limit to 100MB
        });
    }

    // Track connection usage
    activeConnections++;
    return socket;
};

export const release_socket = () => {
    // Decrement usage counter
    if (activeConnections > 0) {
        activeConnections--;
    }

    // Only disconnect when no components are using the socket
    if (activeConnections === 0 && socket) {
        socket.disconnect();
        socket = null;
    }
};
