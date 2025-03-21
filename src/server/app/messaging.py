from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request, current_app
from flask_login import current_user
from app import db
from app.models import Chat, ChatMessages
import datetime
import base64
import json

socketio = SocketIO(maxHttpBufferSize=50 * 1024 * 1024)


@socketio.on("connect")
def handle_connect():
    if not current_user.is_authenticated:
        return False


@socketio.on("join")
def handle_join(data):
    """
    Connect user to chat room and mark messages as read when user joins the chat
    """
    if not current_user.is_authenticated:
        return

    room = str(data["chat_id"])
    join_room(room)

    if current_user.User_id != data.get("sender_id"):
        unread_messages = ChatMessages.query.filter_by(
            Chat_id=data["chat_id"], Sender_id=data.get("sender_id"), Read=False
        ).all()

        for message in unread_messages:
            message.Read = True
            message.Read_timestamp = datetime.datetime.now(datetime.UTC)

        db.session.commit()


@socketio.on("leave")
def handle_leave(data):
    room = str(data["chat_id"])
    leave_room(room)


@socketio.on("sent_message")
def handle_message(data):
    if not current_user.is_authenticated:
        return

    chat_id = data.get("chat_id")
    content = data.get("content")
    image_data = data.get("image")

    if image_data:
        image = base64.b64decode(image_data.split(",")[1])
    else:
        image = None

    new_message = ChatMessages(
        Chat_id=chat_id,
        Sender_id=current_user.User_id,
        Content=content,
        Image=image,
        Timestamp=datetime.datetime.now(datetime.UTC),
        Read=False,
    )

    db.session.add(new_message)
    db.session.commit()

    message_data = {
        "message_id": new_message.Message_id,
        "sender_id": new_message.Sender_id,
        "sender_name": current_user.Username,
        "content": new_message.Content,
        "image": image_data,
        "timestamp": new_message.Timestamp.isoformat(),
        "read": False,
    }

    room = str(chat_id)
    emit("sent_message", message_data, to=room)


@socketio.on("create_chat")
def handle_create_chat(data):
    if not current_user.is_authenticated:
        return

    sender_id = current_user.User_id
    recipient_id = data.get("recipient_id")
    item_id = data.get("item_id")

    # Check if chat already exists
    existing_chat = Chat.query.filter_by(
        Sender_id=sender_id, Recipient_id=recipient_id, Item_id=item_id, Active=True
    ).first()

    # Check if chat already exists with sender and recipient swapped
    if not existing_chat:
        existing_chat = Chat.query.filter_by(
            Sender_id=recipient_id, Recipient_id=sender_id, Item_id=item_id, Active=True
        ).first()

    if not existing_chat:
        new_chat = Chat(
            Sender_id=sender_id, Recipient_id=recipient_id, Item_id=item_id, Active=True
        )

        db.session.add(new_chat)
        db.session.commit()

        chat_id = new_chat.Chat_id
    else:
        chat_id = existing_chat.Chat_id

    # Return chat ID to the client
    emit("chat_created", {"chat_id": chat_id})


@socketio.on("get_messages")
def handle_get_messages(data):
    if not current_user.is_authenticated:
        return

    chat_id = data.get("chat_id")

    messages = (
        ChatMessages.query.filter_by(Chat_id=chat_id)
        .order_by(ChatMessages.Timestamp)
        .all()
    )

    message_list = []
    for msg in messages:
        image_data = None
        if msg.Image:
            image_data = (
                f"data:image/jpeg;base64,{base64.b64encode(msg.Image).decode('utf-8')}"
            )

        message_list.append(
            {
                "message_id": msg.Message_id,
                "sender_id": msg.Sender_id,
                "sender_name": msg.Sender.Username,
                "content": msg.Content,
                "image": image_data,
                "timestamp": msg.Timestamp.isoformat(),
                "read": msg.Read,
            }
        )

    unread_messages = [
        msg
        for msg in messages
        if msg.Sender_id != current_user.User_id and not msg.Read
    ]
    for msg in unread_messages:
        msg.Read = True
        msg.Read_timestamp = datetime.datetime.now(datetime.UTC)

    if unread_messages:
        db.session.commit()

    emit("all_messages", {"all_messages": message_list})
