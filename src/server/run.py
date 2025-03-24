from app import app, socketio
from flask import send_from_directory


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    return send_from_directory("dist", "index.html")


if __name__ == "__main__":
    socketio.run(app, debug=True)
