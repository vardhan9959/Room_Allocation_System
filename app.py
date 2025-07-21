from flask import Flask, request, jsonify, render_template
from flask_pymongo import PyMongo
from bson.objectid import ObjectId

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb+srv://chkeshavardhan:Amma%409676@cluster0.rvsrv.mongodb.net/hotel_management"
mongo = PyMongo(app)

# Uncomment and run this ONCE to insert sample rooms (then comment out again)
# sample_rooms = [
#     {"room_number": 101, "name": "Suite", "ac": True, "status": "Available"},
#     {"room_number": 102, "name": "Suite", "ac": True, "status": "Available"},
#     {"room_number": 201, "name": "Deluxe", "ac": True, "status": "Available"},
#     {"room_number": 301, "name": "Standard", "ac": False, "status": "Available"},
#     {"room_number": 401, "name": "Family", "ac": True, "status": "Available"}
# ]
# mongo.db.rooms.insert_many(sample_rooms)

@app.route('/add_room', methods=['POST'])
def add_room():
    data = request.get_json()
    room_id = mongo.db.rooms.insert_one(data).inserted_id
    return jsonify({"msg": "Room added", "id": str(room_id)}), 201

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/rooms', methods=['GET', 'POST'])
def manage_rooms():
    if request.method == 'POST':
        data = request.json
        room_id = mongo.db.rooms.insert_one(data).inserted_id
        return jsonify({"msg": "Room added", "id": str(room_id)}), 201
    rooms = list(mongo.db.rooms.find())
    for room in rooms:
        room["_id"] = str(room["_id"])
    return jsonify(rooms), 200

@app.route('/bookings', methods=['GET', 'POST'])
def manage_bookings():
    if request.method == 'POST':
        data = request.json
        # Force room_number to be the same type as in MongoDB (here, int)
        data["room_number"] = int(data["room_number"])
        booking_id = mongo.db.bookings.insert_one(data).inserted_id
        result = mongo.db.rooms.update_one(
            {"room_number": data["room_number"]},
            {"$set": {"status": "Booked"}}
        )
        print("Update result:", result.modified_count)  # Debug
        return jsonify({"msg": "Booking successful", "id": str(booking_id)}), 201
    bookings = list(mongo.db.bookings.find())
    for booking in bookings:
        booking["_极客时间_id"] = str(booking["_id"]) if "_极客时间_id" in booking else str(booking["_id"])  # Fix typo if present
    return jsonify(bookings), 200

@app.route('/cancel_booking/<room_number>', methods=['DELETE'])
def cancel_booking(room_number):
    try:
        room_number = int(room_number)  # Match the type in MongoDB
    except ValueError:
        pass  # Keep as string if your data uses strings
    mongo.db.bookings.delete_one({"room_number": room_number})
    result = mongo.db.rooms.update_one(
        {"room_number": room_number},
        {"$set": {"status": "Available"}}
    )
    print("Cancel update result:", result.modified_count)  # Debug
    return jsonify({"msg": "Booking canceled successfully."}), 200

@app.route('/users', methods=['GET', 'POST'])
def manage_users():
    if request.method == 'POST':
        data = request.json
        user_id = mongo.db.users.insert_one(data).inserted_id
        return jsonify({"msg": "User saved", "id": str(user_id)}), 201
    users = list(mongo.db.users.find())
    for user in users:
        user["_id"] = str(user["_id"])
    return jsonify(users), 200

if __name__ == '__main__':
    app.run(debug=True)
