import React, { useState, useEffect, useRef } from "react";
import { useUser, useCSRF } from "../App";
import { Image } from "lucide-react";
import { get_socket, release_socket } from "../hooks/chat_socket";

const ChatWindow = ({ senderId, recipientId, itemId, is_chat_closed }) => {
    const { user } = useUser();
    const { csrfToken } = useCSRF();

    // Stores previous message in chat and new message data
    const [all_messages, set_all_messages] = useState([]);
    const [new_message, set_new_message] = useState("");

    // Stores previous images in chat and new image data
    const [image, set_image] = useState(null);
    const [image_preview, set_image_preview] = useState(null);

    // Stores Chat_ID of current chat window
    const [chat_id, set_chat_id] = useState(null);

    const [is_loading, set_is_loading] = useState(true);
    const [error, set_error] = useState(null);

    // Used to auto scroll to the bottom of the chat window
    const message_end_ref = useRef(null);

    // Stores the socket connection to be used in the chat window
    const socketRef = useRef(null);

    useEffect(() => {
        // Gets the socket from the chat_socket hook
        // Done in another page, as doing it component wise would create a new socket
        // for each chat window, which is not ideal. This way single socket is used for
        // all chat windows, and gets closed when no chat windows are open.
        socketRef.current = get_socket(); // Store the socket in the ref
        const socket = socketRef.current;
        console.log(socket);

        // Initialising event listeners for the socket - on successfull
        // event completion, additional things are done.

        // Defined as ("<event_name>", (<data returned>) => {<function>}
        socket.on("connect", () => {
            // On successful connect, creates a new chat if one doesn't exist
            // or gets the existing chat.
            socketRef.current.emit("create_chat", {
                recipient_id: recipientId,
                item_id: itemId,
            });
        });

        socket.on("chat_created", (data) => {
            // On successful chat creation, set the chat_id...
            set_chat_id(data.chat_id);

            // Joins the chat room...
            socketRef.current.emit("join", {
                chat_id: data.chat_id,
                sender_id: senderId,
            });

            // And gets all the messages in the chat
            socketRef.current.emit("get_messages", {
                chat_id: data.chat_id,
            });
        });

        socket.on("all_messages", (data) => {
            // On successful message retrieval, store the messages
            set_all_messages(data.all_messages);

            // Sets loading to false, to allow HTML to be displayed
            set_is_loading(false);
        });

        socket.on("sent_message", (message) => {
            // On successful message sent, add the message to the chat window
            set_all_messages((prevmessages) => [...prevmessages, message]);
        });

        socket.on("connect_error", (err) => {
            // On connection error, set error message
            set_error("Failed to connect to chat server");

            // Sets loading to false, to allow error message to be displayed
            set_is_loading(false);
        });

        // Disconnects socket when chat window unmounts
        return () => {
            // Remove all event listeners that were set up
            socket.off("connect");
            socket.off("chat_created");
            socket.off("all_messages");
            socket.off("sent_message");
            socket.off("connect_error");

            // Leave the room
            if (chat_id) {
                socketRef.current.emit("leave", { chat_id: chat_id });
            }

            // Release the socket when component unmounts
            release_socket();
        };
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        message_end_ref.current?.scrollIntoView({ behavior: "smooth" });
    }, [all_messages]);

    // Send message to the chat
    const handle_send_message = (event) => {
        event.preventDefault();

        // If message is empty and no image, don't send
        if ((!new_message || new_message.trim() === "") && !image) {
            return;
        }

        // Create the payload
        const payload = {
            chat_id: chat_id,
            content: new_message,
            image: image_preview, // Base64-encoded image
        };

        // Calculate the size of the payload in bytes
        const payload_string = JSON.stringify(payload);
        const payload_size_bytes = new Blob([payload_string]).size;

        // Define the maximum allowed payload size (50 MB)
        const max_payload_size_bytes = 50 * 1024 * 1024;

        // Check if the payload exceeds the maximum size
        if (payload_size_bytes > max_payload_size_bytes) {
            const error_message =
                "File size (" +
                (payload_size_bytes / (1024 * 1024)).toFixed(2) +
                "MB) exceeds the 50 MB limit.";

            set_error(error_message);
            return;
        }

        // Send message via socket
        console.log("Sending message...");
        socketRef.current.emit("sent_message", payload);

        // Clear input fields on success
        set_new_message("");
        set_image(null);
        set_image_preview(null);
        set_error(null); // Clear any previous errors
    };

    // Handle image selection
    const handle_image_change = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            // Validates file type
            if (!file.type.startsWith("image/")) {
                set_error("Invalid file type. Please upload an image.");
                return;
            }

            // Set image and clear error message and input field
            set_image(file);
            set_error(null);
            set_new_message("");

            // Create image preview
            const reader = new FileReader();
            reader.onloadend = () => {
                set_image_preview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Format timestamp
    const format_time = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Show loading text when setting up socket
    if (is_loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading chat...</p>
            </div>
        );
    }

    // Determine if message input should be disabled
    const is_message_input_disabled =
        (user?.level_of_access === 1 && all_messages.length === 0) ||
        image !== null ||
        is_chat_closed;

    // Determine if image upload should be disabled
    const is_image_upload_disabled =
        (user?.level_of_access === 1 && all_messages.length === 0) ||
        (new_message && new_message.trim() !== "") ||
        is_chat_closed;

    return (
        <div className="flex flex-col max-w mx-auto border border-gray-300 rounded-lg bg-white resize-y overflow-hidden min-h-[40vh] max-h-[60vh]">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg pl-[1em] pr-[1em] relative">
                    {error}
                    <button
                        onClick={() => set_error(null)} // Clear the error state to hide the notification
                        className="absolute top-2 right-2 text-red-700 hover:text-red-900"
                        aria-label="Close error notification"
                    >
                        ×
                    </button>
                </div>
            )}
            <div className="px-4 py-3 bg-blue-600 text-white rounded-t-lg">
                <h3 className="font-medium text-lg">Chat</h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {is_chat_closed ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">This chat is now closed.</p>
                    </div>
                ) : user?.level_of_access === 1 && all_messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">
                            Waiting for expert to start the conversation...
                        </p>
                    </div>
                ) : (
                    all_messages.map((message, index) => {
                        const is_own_message = message.sender_id === senderId;
                        return (
                            <div
                                key={message.message_id || index}
                                className={`flex ${
                                    is_own_message ? "justify-end" : "justify-start"
                                } mb-4`}
                            >
                                <div
                                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${
                                        is_own_message
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-800"
                                    }`}
                                >
                                    {!is_own_message && (
                                        <p className="text-xs font-semibold mb-1">
                                            {message.sender_name}
                                        </p>
                                    )}

                                    {message.content && <p className="mb-1">{message.content}</p>}

                                    {message.image && (
                                        <div className="mt-2">
                                            <img
                                                src={message.image}
                                                alt="Shared image"
                                                className="w-full rounded border border-gray-300 max-h-40 object-contain"
                                            />
                                        </div>
                                    )}

                                    <p
                                        className={`text-xs mt-1 ${
                                            is_own_message ? "text-blue-200" : "text-gray-500"
                                        }`}
                                    >
                                        {format_time(message.timestamp)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={message_end_ref} />
            </div>

            {!is_chat_closed && (
                <form
                    onSubmit={handle_send_message}
                    className="p-3 border-t border-gray-300 bg-white rounded-b-lg"
                >
                    {image_preview && (
                        <div className="mb-2 relative">
                            <img
                                src={image_preview}
                                alt="Preview"
                                className="h-24 object-contain border border-gray-300 rounded"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    set_image(null);
                                    set_image_preview(null);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                            type="text"
                            value={new_message}
                            onChange={(e) => set_new_message(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 w-full sm:w-auto"
                            disabled={is_message_input_disabled}
                        />

                        <div className="flex w-full sm:w-auto sm:flex-row flex-col gap-2">
                            <label
                                className={`cursor-pointer px-3 py-2 bg-gray-200 rounded-md flex justify-center items-center ${
                                    is_image_upload_disabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-gray-300"
                                }`}
                            >
                                <Image className="h-5 w-5 text-gray-700" />

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handle_image_change}
                                    className="hidden"
                                    disabled={is_image_upload_disabled}
                                />
                            </label>

                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center"
                                disabled={user?.level_of_access === 1 && all_messages.length === 0}
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ChatWindow;
