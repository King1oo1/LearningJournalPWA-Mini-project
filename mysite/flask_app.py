from flask import Flask, request, jsonify, render_template, send_from_directory
import json, os
from datetime import datetime

app = Flask(__name__)

# Updated to use backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

# Create backend directory if it doesn't exist
if not os.path.exists(BACKEND_DIR):
    os.makedirs(BACKEND_DIR)

DATA_FILE = os.path.join(BACKEND_DIR, "reflections.json")
SNAKE_SCORES_FILE = os.path.join(BACKEND_DIR, "snake_scores.json")

def load_reflections():
    """Load reflections from JSON file in backend folder"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    return []

def save_reflections(reflections):
    """Save reflections to JSON file in backend folder"""
    with open(DATA_FILE, "w", encoding='utf-8') as f:
        json.dump(reflections, f, indent=4)

def load_snake_scores():
    """Load snake scores from JSON file in backend folder"""
    if os.path.exists(SNAKE_SCORES_FILE):
        try:
            with open(SNAKE_SCORES_FILE, "r", encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    return []

def save_snake_scores(scores):
    """Save snake scores to JSON file in backend folder"""
    with open(SNAKE_SCORES_FILE, "w", encoding='utf-8') as f:
        json.dump(scores, f, indent=4)

# Serve service worker with correct MIME type
@app.route('/sw.js')
def serve_sw():
    return send_from_directory('static/js', 'sw.js', mimetype='application/javascript')

# Serve manifest.json
@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory('static', 'manifest.json', mimetype='application/json')


# Serve offline page
@app.route('/offline')
def offline():
    return render_template('offline.html')

# Main routes for your PWA pages
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/journal")
def journal():
    return render_template("journal.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/projects")
def projects():
    return render_template("projects.html")

# API routes for reflections
@app.route("/api/reflections", methods=["GET"])
def get_reflections():
    """Get all reflections"""
    reflections = load_reflections()
    return jsonify(reflections)

@app.route("/api/reflections", methods=["POST"])
def add_reflection():
    """Add a new reflection"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

# Validate fields
        name = data.get("name", "Anonymous").strip()
        reflection_text = data.get("reflection", "").strip()

        if not reflection_text:
            return jsonify({"error": "Reflection content cannot be empty"}), 400



        new_reflection = {
            "name": data.get("name", "Anonymous"),
            "date": datetime.now().strftime("%a %b %d %Y"),
            "reflection": data.get("reflection", "")
        }

        reflections = load_reflections()
        reflections.append(new_reflection)
        save_reflections(reflections)

        return jsonify(new_reflection), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Extra Feature: DELETE endpoint
@app.route("/api/reflections/<int:index>", methods=["DELETE"])
def delete_reflection(index):
    """Delete a reflection by index"""
    try:
        reflections = load_reflections()
        if 0 <= index < len(reflections):
            deleted_reflection = reflections.pop(index)
            save_reflections(reflections)
            return jsonify(deleted_reflection), 200
        else:
            return jsonify({"error": "Index out of range"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Snake Game Scores API
@app.route("/api/snake-scores", methods=["GET"])
def get_snake_scores():
    """Get all snake scores"""
    try:
        scores = load_snake_scores()
        # Sort by score descending
        scores.sort(key=lambda x: x['score'], reverse=True)
        return jsonify(scores)
    except Exception as e:
        print(f"Error reading snake scores: {e}")
        return jsonify([])

@app.route("/api/snake-scores", methods=["POST"])
def add_snake_score():
    """Add a new snake score"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        new_score = {
            "name": data.get("name", "Anonymous"),
            "score": data.get("score", 0),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        # Load existing scores
        scores = load_snake_scores()

        # Add new score and sort
        scores.append(new_score)
        scores.sort(key=lambda x: x['score'], reverse=True)

        # Keep only top 10 scores
        scores = scores[:10]

        # Save back to file
        save_snake_scores(scores)

        return jsonify({"success": True})

    except Exception as e:
        print(f"Error saving snake score: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# Health check endpoint for PWA
@app.route("/health")
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# ERROR HANDLERS FOR PWA
@app.errorhandler(404)
def not_found(error):
    return render_template('offline.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


# Serve snake_scores.json statically for fallback
@app.route("/static/snake_scores.json")
def serve_snake_scores():
    return send_from_directory('backend', 'snake_scores.json')

if __name__ == "__main__":
    app.run(debug=True)
