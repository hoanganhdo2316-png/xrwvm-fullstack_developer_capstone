import json
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase

from .restapis import UpstreamError


class AuthenticationApiTests(TestCase):
    def post_json(self, path, payload):
        return self.client.post(path, data=json.dumps(payload), content_type="application/json")

    def test_registration_login_status_and_logout(self):
        response = self.post_json(
            "/djangoapp/register",
            {
                "userName": "capstone_user",
                "firstName": "Capstone",
                "lastName": "Reviewer",
                "email": "capstone@example.org",
                "password": "StrongCapstonePass!42",
                "confirmPassword": "StrongCapstonePass!42",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.get(username="capstone_user").check_password("StrongCapstonePass!42"))
        self.assertTrue(self.client.get("/djangoapp/loginstatus").json()["isAuthenticated"])
        self.assertEqual(self.client.post("/djangoapp/logout").status_code, 200)
        self.assertFalse(self.client.get("/djangoapp/loginstatus").json()["isAuthenticated"])

    def test_registration_keeps_minimal_lab_payload_compatible(self):
        response = self.post_json(
            "/djangoapp/register",
            {"userName": "minimal_user", "password": "lab-password"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["userName"], "minimal_user")
        self.assertTrue(User.objects.get(username="minimal_user").check_password("lab-password"))

    def test_registration_rejects_missing_duplicate_and_invalid_data(self):
        self.assertEqual(self.post_json("/djangoapp/register", {}).status_code, 400)
        payload = {
            "userName": "duplicate",
            "firstName": "Test",
            "lastName": "User",
            "email": "duplicate@example.org",
            "password": "StrongCapstonePass!42",
            "confirmPassword": "StrongCapstonePass!42",
        }
        self.assertEqual(self.post_json("/djangoapp/register", payload).status_code, 201)
        self.client.logout()
        self.assertEqual(self.post_json("/djangoapp/register", payload).status_code, 409)

    def test_login_rejects_invalid_json_and_credentials(self):
        response = self.client.post("/djangoapp/login", data="[1]", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        response = self.post_json("/djangoapp/login", {"userName": "missing", "password": "wrong"})
        self.assertEqual(response.status_code, 401)


class DealershipApiTests(TestCase):
    @patch("djangoapp.views.get_request", return_value=[{"id": 1, "state": "Texas"}])
    def test_get_dealers_keeps_frontend_response_contract(self, get_request_mock):
        response = self.client.get("/djangoapp/get_dealers/Texas")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["dealers"][0]["id"], 1)
        get_request_mock.assert_called_once_with("fetchDealers/Texas")

    @patch("djangoapp.views.get_request", side_effect=UpstreamError("Database API unavailable", 502))
    def test_upstream_error_is_returned_as_json(self, _get_request_mock):
        response = self.client.get("/djangoapp/get_dealers")
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()["error"], "Database API unavailable")

    def test_review_submission_requires_authentication(self):
        response = self.post_json("/djangoapp/add_review", {"review": "Great"})
        self.assertEqual(response.status_code, 401)

    def test_authenticated_review_rejects_malformed_json_clearly(self):
        user = User.objects.create_user(username="reviewer", password="lab-password")
        self.client.force_login(user)
        response = self.client.post("/djangoapp/add_review", data="{", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "Request body must be valid JSON")

    @patch("djangoapp.views.post_review", return_value={"id": 51, "review": "Great service"})
    def test_authenticated_review_submission(self, post_review_mock):
        user = User.objects.create_user(
            username="reviewer", password="StrongCapstonePass!42", first_name="Review", last_name="Writer"
        )
        self.client.force_login(user)
        response = self.post_json(
            "/djangoapp/add_review",
            {
                "dealership": 1,
                "review": "Great service",
                "purchase": True,
                "purchase_date": "2023-06-10",
                "car_make": "Nissan",
                "car_model": "Pathfinder",
                "car_year": 2023,
            },
        )
        self.assertEqual(response.status_code, 201)
        payload = post_review_mock.call_args.args[0]
        self.assertEqual(payload["name"], "Review Writer")
        self.assertTrue(payload["purchase"])

    def post_json(self, path, payload):
        return self.client.post(path, data=json.dumps(payload), content_type="application/json")


class PageAndHealthTests(TestCase):
    def test_static_pages_and_health_are_available(self):
        for path in ("/", "/about", "/contact", "/djangoapp/health"):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)
