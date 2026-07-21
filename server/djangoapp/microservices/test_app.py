import unittest

from .app import app


class SentimentApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health_and_sentiment_classes(self):
        self.assertEqual(self.client.get("/").status_code, 200)
        self.assertEqual(self.client.post("/analyze", json={"text": "I love this car"}).json["sentiment"], "positive")
        self.assertEqual(self.client.post("/analyze", json={"text": "This is terrible"}).json["sentiment"], "negative")
        self.assertEqual(self.client.post("/analyze", json={"text": "It is a car"}).json["sentiment"], "neutral")

    def test_invalid_requests(self):
        self.assertEqual(self.client.post("/analyze", data="text").status_code, 415)
        self.assertEqual(self.client.post("/analyze", json={}).status_code, 400)


if __name__ == "__main__":
    unittest.main()
