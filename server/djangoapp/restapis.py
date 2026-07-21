import os
from urllib.parse import quote
import requests
from dotenv import load_dotenv

load_dotenv()
BACKEND_URL = os.getenv("EXPRESS_BACKEND_URL", os.getenv("backend_url", "http://localhost:3030")).rstrip("/")
SENTIMENT_URL = os.getenv(
    "SENTIMENT_ANALYZER_URL", os.getenv("sentiment_analyzer_url", "http://localhost:5050")
).rstrip("/")
TIMEOUT = float(os.getenv("UPSTREAM_TIMEOUT_SECONDS", "8"))


class UpstreamError(Exception):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


def _json_response(response):
    try:
        payload = response.json()
    except ValueError as exc:
        raise UpstreamError("Upstream service returned invalid JSON") from exc
    if not response.ok:
        message = (
            payload.get("error", "Upstream request failed") if isinstance(payload, dict) else "Upstream request failed"
        )
        raise UpstreamError(message, response.status_code)
    return payload


def get_request(endpoint, **params):
    try:
        return _json_response(
            requests.get(f'{BACKEND_URL}/{endpoint.lstrip("/")}', params=params or None, timeout=TIMEOUT)
        )
    except requests.Timeout as exc:
        raise UpstreamError("Upstream service timed out", 504) from exc
    except requests.RequestException as exc:
        raise UpstreamError("Upstream service is unavailable", 502) from exc


def analyze_review_sentiments(text):
    if not text or not text.strip():
        raise ValueError("Review text is required")
    try:
        response = requests.post(f"{SENTIMENT_URL}/analyze", json={"text": text}, timeout=TIMEOUT)
        if response.status_code == 404:
            response = requests.get(f'{SENTIMENT_URL}/analyze/{quote(text, safe="")}', timeout=TIMEOUT)
        return _json_response(response).get("sentiment", "neutral")
    except requests.Timeout as exc:
        raise UpstreamError("Sentiment service timed out", 504) from exc
    except requests.RequestException as exc:
        raise UpstreamError("Sentiment service is unavailable", 502) from exc


def post_review(data):
    try:
        return _json_response(requests.post(f"{BACKEND_URL}/insert_review", json=data, timeout=TIMEOUT))
    except requests.Timeout as exc:
        raise UpstreamError("Upstream service timed out", 504) from exc
    except requests.RequestException as exc:
        raise UpstreamError("Upstream service is unavailable", 502) from exc
