import json
import logging
from datetime import date

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import CarMake
from .populate import initiate
from .restapis import UpstreamError, analyze_review_sentiments, get_request, post_review

logger = logging.getLogger(__name__)


def _body(request):
    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ValueError("Request body must be valid JSON") from exc
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object")
    return data


def _error(message, status=400):
    return JsonResponse({"status": status, "error": message}, status=status)


@require_http_methods(["GET"])
def health(request):
    return JsonResponse({"status": "ok"})


@csrf_exempt
@require_http_methods(["POST"])
def login_user(request):
    try:
        data = _body(request)
        username = str(data.get("userName", data.get("username", ""))).strip()
        password = data.get("password", "")
        if not username or not password:
            return _error("Username and password are required")
        user = authenticate(request, username=username, password=password)
        if user is None:
            return _error("Invalid username or password", 401)
        login(request, user)
        return JsonResponse(
            {
                "status": "Authenticated",
                "userName": user.username,
                "firstName": user.first_name,
                "lastName": user.last_name,
            }
        )
    except ValueError as exc:
        return _error(str(exc))


@csrf_exempt
@require_http_methods(["POST", "GET"])
def logout_user(request):
    logout(request)
    return JsonResponse({"status": "Logged out"})


@csrf_exempt
@require_http_methods(["POST"])
def registration(request):
    try:
        data = _body(request)
        username = str(data.get("userName", data.get("username", ""))).strip()
        first_name = str(data.get("firstName", "")).strip()
        last_name = str(data.get("lastName", "")).strip()
        email = str(data.get("email", "")).strip()
        password = data.get("password", "")
        confirm = data.get("confirmPassword", data.get("password2", password))
        missing = [
            name
            for name, value in (
                ("username", username),
                ("password", password),
            )
            if not value
        ]
        if missing:
            return _error(f'Missing fields: {", ".join(missing)}')
        if password != confirm:
            return _error("Passwords do not match")
        if email:
            validate_email(email)
        if User.objects.filter(username__iexact=username).exists():
            return _error("Username is already registered", 409)
        candidate = User(username=username, email=email, first_name=first_name, last_name=last_name)
        candidate.set_password(password)
        candidate.save()
        login(request, candidate)
        return JsonResponse(
            {
                "status": "Authenticated",
                "userName": candidate.username,
                "firstName": candidate.first_name,
                "lastName": candidate.last_name,
            },
            status=201,
        )
    except ValidationError as exc:
        return _error(" ".join(exc.messages))
    except ValueError as exc:
        return _error(str(exc))


@require_http_methods(["GET"])
def login_status(request):
    user = request.user
    return JsonResponse(
        {
            "isAuthenticated": user.is_authenticated,
            "userName": user.username if user.is_authenticated else "",
            "firstName": user.first_name if user.is_authenticated else "",
            "lastName": user.last_name if user.is_authenticated else "",
        }
    )


def _proxy(callable_):
    try:
        return callable_()
    except UpstreamError as exc:
        return _error(str(exc), exc.status)
    except Exception:
        logger.exception("Unexpected API error")
        return _error("Unexpected server error", 500)


@require_http_methods(["GET"])
def get_dealerships(request, state=None):
    endpoint = "fetchDealers" if not state or state.lower() == "all" else f"fetchDealers/{state}"
    return _proxy(lambda: JsonResponse({"status": 200, "dealers": get_request(endpoint)}))


@require_http_methods(["GET"])
def get_dealer_details(request, dealer_id):
    return _proxy(lambda: JsonResponse({"status": 200, "dealer": [get_request(f"fetchDealer/{dealer_id}")]}))


@require_http_methods(["GET"])
def get_dealer_reviews(request, dealer_id):
    def response():
        reviews = get_request(f"fetchReviews/dealer/{dealer_id}")
        for review in reviews:
            try:
                review["sentiment"] = analyze_review_sentiments(review.get("review", ""))
            except (UpstreamError, ValueError):
                review["sentiment"] = "neutral"
        return JsonResponse({"status": 200, "reviews": reviews})

    return _proxy(response)


@csrf_exempt
@require_http_methods(["POST"])
def add_review(request):
    if not request.user.is_authenticated:
        return _error("Authentication required", 401)
    try:
        data = _body(request)
    except ValueError as exc:
        return _error(str(exc))
    try:
        dealership = int(data.get("dealership", 0))
        car_year = int(data.get("car_year", 0))
    except (ValueError, TypeError):
        return _error("Dealership and car year must be valid integers")
    data["name"] = request.user.get_full_name().strip() or request.user.username
    data["dealership"] = dealership
    data["car_year"] = car_year
    data["purchase"] = data.get("purchase") is True
    required = ("review", "car_make", "car_model")
    missing = [field for field in required if not str(data.get(field, "")).strip()]
    if dealership < 1 or not 2015 <= car_year <= date.today().year + 1:
        return _error("Dealership or car year is outside the accepted range")
    if missing:
        return _error(f'Missing fields: {", ".join(missing)}')
    if data["purchase"] and not str(data.get("purchase_date", "")).strip():
        return _error("Purchase date is required for purchased vehicles")
    data["purchase_date"] = str(data.get("purchase_date", "")).strip()
    return _proxy(lambda: JsonResponse({"status": 201, "review": post_review(data)}, status=201))


@require_http_methods(["GET"])
def get_cars(request):
    if not CarMake.objects.exists():
        initiate()
    models = [
        {"CarMake": model.car_make.name, "CarModel": model.name, "CarType": model.type, "CarYear": model.year}
        for make in CarMake.objects.prefetch_related("car_models")
        for model in make.car_models.all()
    ]
    return JsonResponse({"status": 200, "CarModels": models})
