import os
import csv
import json
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
# Create a new client and connect to the server



app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
host='0.0.0.0'

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

uri = os.getenv("uri")
client = MongoClient(uri, server_api=ServerApi('1'))
db = client["rp-analysis"]

from datetime import datetime

@app.route('/', methods=['GET'])
def home():
    return "Hello, World!", 200

@app.route('/test-mongo', methods=['GET'])
def test_mongo():
    try:
        # Test the connection by listing collections
        collections = db.list_collection_names()
        return jsonify({"status": "success", "collections": collections}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/<event_id>/manifold', methods=['GET'])
def get_manifold_data(event_id):
    try:
        # Access the MongoDB collection corresponding to the event_id
        collection = db[event_id]

        # Query the collection to fetch Time and Manifold fields
        data = list(collection.find({}, {"_id": 0, "Time": 1, "Manifold": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        # Calculate Time relative to the first timestamp
        start_time = int(data[0]["Time"])  # Ensure Time is an integer

        for point in data:
            if "Time" in point and point["Time"] is not None:
                original_time = int(point["Time"])
                adjusted_time = (original_time - start_time) / 1_000_000_000  # Convert nanoseconds to seconds
                point["Time"] = adjusted_time
            else:
                point["Time"] = 0  # Default to 0 if Time is missing

        # Return the data as JSON
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching manifold data: {str(e)}"}), 500


@app.route('/<event_id>/burntime', methods=['GET'])
def get_burn_time(event_id):
    try:
        # Access the MongoDB collection corresponding to the event_id
        collection = db[event_id]

        # Query the collection to fetch Time and Manifold fields
        data = list(collection.find({}, {"_id": 0, "Time": 1, "Manifold": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        # Convert Time to an integer and extract timestamps and manifold values
        timestamps = [int(point["Time"]) / 1_000_000_000 for point in data]  # Convert nanoseconds to seconds
        manifold_values = [float(point["Manifold"]) for point in data]  # Ensure Manifold is a float

        # Use the find_start_and_end_times function without the buffer
        start_time, end_time = find_start_and_end_times(
            timestamps, manifold_values, buffer_seconds=0
        )

        # Calculate burn time
        burn_time = end_time - start_time

        return jsonify({"burn_time": burn_time, "start_time": start_time, "end_time": end_time}), 200
    except Exception as e:
        print(f"Error calculating burn time: {e}")  # Debugging
        return jsonify({"error": f"Error calculating burn time: {str(e)}"}), 500

@app.route('/<event_id>/dp', methods=['GET'])
def get_differential_pressure(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1, "Tank": 1, "Manifold": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        start_time = int(data[0]["Time"])  # Ensure Time is an integer
        dp_data = []
        for point in data:
            if "Time" in point and "Tank" in point and "Manifold" in point:
                adjusted_time = (int(point["Time"]) - start_time) / 1_000_000_000  # Convert nanoseconds to seconds
                dp = float(point["Tank"]) - float(point["Manifold"])
                dp_data.append({"Time": adjusted_time, "DP": dp})

        return jsonify({"data": dp_data}), 200
    except Exception as e:
        return jsonify({"error": f"Error calculating differential pressure: {str(e)}"}), 500


@app.route('/<event_id>/tank', methods=['GET'])
def get_tank_pressure(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1, "Tank": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        start_time = int(data[0]["Time"])  # Ensure Time is an integer
        tank_data = []
        for point in data:
            if "Time" in point and "Tank" in point:
                adjusted_time = (int(point["Time"]) - start_time) / 1_000_000_000  # Convert nanoseconds to seconds
                tank_data.append({"Time": adjusted_time, "Tank": float(point["Tank"])})

        return jsonify({"data": tank_data}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching tank pressure: {str(e)}"}), 500


@app.route('/<event_id>/tanklc', methods=['GET'])
def get_tanklc(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1, "TankLC": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        start_time = int(data[0]["Time"])  # Ensure Time is an integer
        tanklc_data = []
        for point in data:
            if "Time" in point and "TankLC" in point:
                adjusted_time = (int(point["Time"]) - start_time) / 1_000_000_000  # Convert nanoseconds to seconds
                tanklc_data.append({"Time": adjusted_time, "TankLC": float(point["TankLC"])})

        return jsonify({"data": tanklc_data}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching TankLC data: {str(e)}"}), 500


@app.route('/<event_id>/thrustlc', methods=['GET'])
def get_thrustlc(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1, "ThrustLC": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        start_time = int(data[0]["Time"])  # Ensure Time is an integer
        thrustlc_data = []
        for point in data:
            if "Time" in point and "ThrustLC" in point:
                adjusted_time = (int(point["Time"]) - start_time) / 1_000_000_000  # Convert nanoseconds to seconds
                thrustlc_data.append({"Time": adjusted_time, "ThrustLC": float(point["ThrustLC"])})

        return jsonify({"data": thrustlc_data}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching ThrustLC data: {str(e)}"}), 500


@app.route('/<event_id>/pressures', methods=['GET'])
def get_pressures(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1, "Chamber": 1, "Manifold": 1, "Tank": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        start_time = int(data[0]["Time"])  # Ensure Time is an integer
        pressures_data = []
        for point in data:
            if "Time" in point:
                adjusted_time = (int(point["Time"]) - start_time) / 1_000_000_000  # Convert nanoseconds to seconds
                pressures_data.append({
                    "Time": adjusted_time,
                    "Chamber": float(point.get("Chamber", 0)),
                    "Manifold": float(point.get("Manifold", 0)),
                    "Tank": float(point.get("Tank", 0)),
                })

        return jsonify({"data": pressures_data}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching pressures: {str(e)}"}), 500


@app.route('/<event_id>/mdot', methods=['GET'])
def get_mass_flow_rate(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1, "TankLC": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        start_time = int(data[0]["Time"])  # Ensure Time is an integer
        mdot_data = []
        for i in range(1, len(data)):
            time_diff = (int(data[i]["Time"]) - int(data[i - 1]["Time"])) / 1_000_000_000  # Convert nanoseconds to seconds
            if time_diff > 0:
                mdot = (float(data[i]["TankLC"]) - float(data[i - 1]["TankLC"])) / time_diff
                adjusted_time = (int(data[i]["Time"]) - start_time) / 1_000_000_000
                mdot_data.append({"Time": adjusted_time, "Mdot": mdot})

        return jsonify({"data": mdot_data}), 200
    except Exception as e:
        return jsonify({"error": f"Error calculating mass flow rate: {str(e)}"}), 500


@app.route('/<event_id>/stiff', methods=['GET'])
def get_injector_stiffness(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1, "Manifold": 1, "Chamber": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        start_time = int(data[0]["Time"])  # Ensure Time is an integer
        stiffness_data = []
        for point in data:
            if "Manifold" in point and "Chamber" in point and float(point["Chamber"]) != 0:
                adjusted_time = (int(point["Time"]) - start_time) / 1_000_000_000  # Convert nanoseconds to seconds
                stiffness = (float(point["Manifold"]) - float(point["Chamber"])) / float(point["Chamber"])
                stiffness_data.append({"Time": adjusted_time, "Stiffness": stiffness})

        return jsonify({"data": stiffness_data}), 200
    except Exception as e:
        return jsonify({"error": f"Error calculating injector stiffness: {str(e)}"}), 500

@app.route('/<event_id>/peakThrust', methods=['GET'])
def get_peak_thrust(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "ThrustLC": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        peak_thrust = max(float(point["ThrustLC"]) for point in data if "ThrustLC" in point)

        return jsonify({"peakThrust": peak_thrust}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching peak thrust: {str(e)}"}), 500


@app.route('/<event_id>/peakChamber', methods=['GET'])
def get_peak_chamber(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Chamber": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        peak_chamber = max(float(point["Chamber"]) for point in data if "Chamber" in point)

        return jsonify({"peakChamber": peak_chamber}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching peak chamber pressure: {str(e)}"}), 500

@app.route('/<event_id>/peakMdot', methods=['GET'])
def get_peak_mdot(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1, "TankLC": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        # Ensure Time is an integer and calculate Mdot
        mdot_values = []
        for i in range(1, len(data)):
            time_diff = (int(data[i]["Time"]) - int(data[i - 1]["Time"])) / 1_000_000_000  # Convert nanoseconds to seconds
            if time_diff > 0:
                mdot = (float(data[i]["TankLC"]) - float(data[i - 1]["TankLC"])) / time_diff
                mdot_values.append(mdot)

        if not mdot_values:
            return jsonify({"error": "No valid Mdot values found"}), 404

        # Calculate the peak Mdot
        peak_mdot = max(mdot_values)

        return jsonify({"peakMdot": peak_mdot}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching peak Mdot: {str(e)}"}), 500

@app.route('/<event_id>/dataRate', methods=['GET'])
def get_data_rate(event_id):
    try:
        collection = db[event_id]
        data = list(collection.find({}, {"_id": 0, "Time": 1}))

        if not data:
            return jsonify({"error": "No data found for the given event ID"}), 404

        time_diffs = [
            (float(data[i]["Time"]) - float(data[i - 1]["Time"])) / 1_000_000_000  # Convert to seconds
            for i in range(1, len(data))
        ]
        avg_data_rate = sum(time_diffs) / len(time_diffs) if time_diffs else 0

        return jsonify({"dataRate": 1.0/(avg_data_rate)}), 200
    except Exception as e:
        return jsonify({"error": f"Error calculating data rate: {str(e)}"}), 500

@app.route('/collections', methods=['GET'])
def get_collections():
    try:
        # Fetch all collection names from the database
        collections = []
        for name in db.list_collection_names():
            # Set default metadata
            metadata = {
                "author": "admin",  # Default author
                "uploadDate": datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # Current date and time
            }
            collections.append({
                "name": name,
                "author": metadata["author"],
                "uploadDate": metadata["uploadDate"]
            })
        return jsonify({"collections": collections}), 200
    except Exception as e:
        return jsonify({"error": f"Error fetching collections: {str(e)}"}), 500

@app.route('/upload', methods=['POST'])
def upload():
    # Get the uploaded file
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    # Get the tags/mapping
    tags = request.form.get('tags')
    if not tags:
        return jsonify({"error": "No tags provided"}), 400

    tags = json.loads(tags)  # Convert JSON string to Python dictionary

    # Get the new CSV file name
    new_csv_name = request.form.get('new_csv_name')
    if not new_csv_name:
        return jsonify({"error": "No new CSV file name provided"}), 400
    new_csv_name += '.csv'

    # Save the uploaded file
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    # # Validate that all `pt` columns are mapped
    # with open(file_path, mode='r') as csv_file:
    #     reader = csv.DictReader(csv_file)
    #     csv_headers = reader.fieldnames

    #     # Identify `pt` columns in the CSV
    #     pt_columns = [header for header in csv_headers if header.startswith('pt')]

    #     # Check if all `pt` columns are in the tags mapping
    #     unmapped_pt_columns = [col for col in pt_columns if col not in tags]
    #     if unmapped_pt_columns:
    #         return jsonify({
    #             "error": "Some `pt` columns in the CSV are not mapped.",
    #             "unmapped_pt_columns": unmapped_pt_columns
    #         }), 400

    # Rename the headers and save the new CSV
    renamed_csv_path = os.path.join(UPLOAD_FOLDER, secure_filename(new_csv_name))
    try:
        rename_headers(file_path, renamed_csv_path, tags)
    except Exception as e:
        return jsonify({"error": f"Error renaming headers: {str(e)}"}), 500

    # Process the renamed CSV to calculate start and end times
    try:
        trimmed_data, trimmed_headers = process_csv(renamed_csv_path, tags)
    except Exception as e:
        return jsonify({"error": f"Error processing CSV: {str(e)}"}), 500

    try:
        save_trimmed_csv(renamed_csv_path, trimmed_headers, trimmed_data)
    except Exception as e:
        return jsonify({"error": f"Error saving trimmed CSV: {str(e)}"}), 500

    try:
        collection_name = os.path.splitext(new_csv_name)[0]  # Use the file name without the .csv extension
        insert_to_mongo(trimmed_headers, trimmed_data, collection_name)
    except Exception as e:
        return jsonify({"error": f"Error inserting into MongoDB: {str(e)}"}), 500

    return jsonify({"message": "File processed and saved successfully"}), 200


def rename_headers(input_path, output_path, tags):
    with open(input_path, mode='r') as infile, open(output_path, mode='w', newline='') as outfile:
        reader = csv.DictReader(infile)
        original_headers = reader.fieldnames
        if not original_headers:
            raise ValueError("CSV file has no headers.")

        # Map original headers to new headers using tags
        renamed_headers = [tags.get(header, header) for header in original_headers]

        writer = csv.DictWriter(outfile, fieldnames=renamed_headers)
        writer.writeheader()
        for row in reader:
            renamed_row = {tags.get(key, key): value for key, value in row.items()}
            writer.writerow(renamed_row)

def process_csv(file_path, tags):
    timestamps = []
    manifold_values = []
    data_rows = []

    # Read the renamed CSV and extract relevant data
    try:
        with open(file_path, mode='r') as file:
            reader = csv.DictReader(file)
            headers = reader.fieldnames

            # Ensure the required columns exist
            if 'Time' not in headers or 'Manifold' not in headers:
                raise ValueError("CSV must contain 'Time' and 'Manifold' columns.")

            for row in reader:
                # Convert timestamp from nanoseconds to seconds
                timestamps.append(int(row['Time']) / 1_000_000_000)
                manifold_values.append(float(row['Manifold']))
                data_rows.append(row)
    except FileNotFoundError:
        raise FileNotFoundError(f"Error: File '{file_path}' not found.")
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")
    
    start_time, end_time = find_start_and_end_times(timestamps, manifold_values)

    # Trim the data to the range of interest
    trimmed_data = [
        row for i, row in enumerate(data_rows)
        if start_time <= timestamps[i] <= end_time
    ]

    return trimmed_data, headers

def find_start_and_end_times(timestamps, manifold_values, start_slope_threshold=5000, proximity_threshold=10, buffer_seconds=5):
    start_index = None
    end_index = None

    # Detect the start of flow based on slope
    for i in range(1, len(manifold_values)):
        slope = (manifold_values[i] - manifold_values[i - 1]) / (timestamps[i] - timestamps[i - 1])
        if start_index is None and slope > start_slope_threshold:
            start_index = i
            break

    if start_index is None:
        raise ValueError("Flow start could not be detected.")

    # Calculate the average of manifold values before the start of flow
    pre_flow_average = sum(manifold_values[:start_index]) / len(manifold_values[:start_index])

    # Detect the end of flow based on proximity to the pre-flow average
    for i in range(start_index + 1, len(manifold_values)):
        if abs(manifold_values[i] - pre_flow_average) <= proximity_threshold:
            end_index = i
            break

    if end_index is None:
        raise ValueError("Flow end could not be detected.")

    # Add a buffer to the start and end times
    start_time = max(0, timestamps[start_index] - buffer_seconds)
    end_time = timestamps[end_index] + buffer_seconds

    return start_time, end_time

def save_trimmed_csv(file_path, headers, data):
    with open(file_path, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data)

def insert_to_mongo(headers, data, collection_name):
    # Convert rows to MongoDB documents
    documents = [
        {header: row[header] for header in headers}
        for row in data
    ]

    # Dynamically create a new collection with the given name
    dynamic_collection = db[collection_name]
    dynamic_collection.insert_many(documents)

if __name__ == '__main__':
    app.run(debug=True)