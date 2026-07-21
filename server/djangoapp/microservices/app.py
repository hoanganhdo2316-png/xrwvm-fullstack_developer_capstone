from pathlib import Path
from flask import Flask, jsonify, request
from nltk.data import path as nltk_data_path
from nltk.sentiment import SentimentIntensityAnalyzer

app = Flask(__name__)
NLTK_ROOT = Path(__file__).resolve().parent
nltk_data_path.insert(0, str(NLTK_ROOT))
sia = SentimentIntensityAnalyzer()


def classify(text):
    compound = sia.polarity_scores(text)["compound"]
    if compound >= 0.05:
        return "positive"
    if compound <= -0.05:
        return "negative"
    return "neutral"


@app.get("/")
def home():
    return jsonify({"service": "sentiment-analyzer", "status": "ok"})


@app.post("/analyze")
def analyze_post():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object"}), 400
    text = data.get("text", "")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "Review text is required"}), 400
    return jsonify({"sentiment": classify(text.strip())})


@app.get("/analyze/<path:input_txt>")
def analyze_get(input_txt):
    if not input_txt.strip():
        return jsonify({"error": "Review text is required"}), 400
    return jsonify({"sentiment": classify(input_txt.strip())})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
