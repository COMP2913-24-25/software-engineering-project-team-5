import io from "socket.io-client";
import config from "../../config";

let socket = null;
let activeConnections = 0;

export const get_socket = () => {
    // Only initialize if not already done
    const { api_base_url } = config;

    if (!socket) {
        socket = io(`${api_base_url}`, {
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
