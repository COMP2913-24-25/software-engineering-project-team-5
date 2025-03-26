import io from "socket.io-client";
import config from "../../config";

let notificationSocket = null;
let activeConnections = 0;

export const get_notification_socket = () => {
    const { api_base_url } = config;

    if (!notificationSocket) {
        notificationSocket = io(`${api_base_url}`, {
            withCredentials: true,
            maxHttpBufferSize: 50 * 1024 * 1024,
        });
    }

    activeConnections++;
    return notificationSocket;
};

export const release_notification_socket = () => {
    if (activeConnections > 0) {
        activeConnections--;
    }

    if (activeConnections === 0 && notificationSocket) {
        notificationSocket.disconnect();
        notificationSocket = null;
    }
};
