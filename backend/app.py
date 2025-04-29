import os
import csv
import json
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["rp-analysis"]

@app.route('/collections', methods=['GET'])
def get_collections():
    try:
        # Fetch all collection names from the database
        collection_names = db.list_collection_names()
        return jsonify({"collections": [{"name": name} for name in collection_names]}), 200
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

    # Identify the "start of flow" and "end of flow"
    start_index = None
    end_index = None
    start_slope_threshold = 10000  # Threshold for detecting the start of flow

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
        if abs(manifold_values[i] - pre_flow_average) <= 10:
            end_index = i
            break

    if end_index is None:
        raise ValueError("Flow end could not be detected.")

    # Add a 5-second buffer to the start and end
    start_time = max(0, timestamps[start_index] - 5)
    end_time = timestamps[end_index] + 5

    # Trim the data to the range of interest
    trimmed_data = [
        row for i, row in enumerate(data_rows)
        if start_time <= timestamps[i] <= end_time
    ]

    return trimmed_data, headers

def detect_flow(timestamps, manifold_values):
    start_index = None
    end_index = None
    start_slope_threshold = 10000  # Threshold for detecting the start of flow
    ambient_threshold = 50         # Threshold for detecting ambient pressure
    ambient_duration = 5           # Duration (in seconds) for ambient pressure to confirm end of flow

    # Detect the start of flow based on slope
    for i in range(1, len(manifold_values)):
        slope = (manifold_values[i] - manifold_values[i - 1]) / (timestamps[i] - timestamps[i - 1])
        if start_index is None and slope > start_slope_threshold:
            return 100, 101
            start_index = i

    # Detect the end of flow based on ambient pressure
    if start_index is not None:
        for i in range(start_index + 1, len(manifold_values)):
            if manifold_values[i] < ambient_threshold:
                # Check if the pressure remains below the threshold for the specified duration
                ambient_start_time = timestamps[i]
                ambient_end_time = ambient_start_time + ambient_duration
                if all(manifold_values[j] < ambient_threshold for j in range(i, len(manifold_values))
                       if timestamps[j] <= ambient_end_time):
                    end_index = i
                    break

    return start_index, end_index

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