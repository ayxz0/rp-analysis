from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import pandas as pd
from pymongo import MongoClient

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = './uploads'  # Directory to save uploaded files
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["rp-analysis"]
collection = db["csv-data"]


from datetime import datetime

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and file.filename.endswith('.csv'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Process CSV and insert as a single document in MongoDB
        try:
            df = pd.read_csv(filepath)
            data = df.to_dict(orient='records')  # Convert CSV rows to a list of dictionaries

            # Create a document with metadata and CSV content
            document = {
                "filename": filename,
                "upload_time": datetime.utcnow(),  # Store the upload time in UTC
                "content": data  # Store the CSV rows as an array
            }

            # Insert the document into MongoDB
            collection.insert_one(document)
            return jsonify({"message": "File uploaded and data saved to MongoDB"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return jsonify({"error": "Invalid file type"}), 400

if __name__ == '__main__':
    app.run(debug=True)