import json
import logging
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import CarMake
from .populate import initiate
from .restapis import UpstreamError, analyze_review_sentiments, get_request, post_review

logger = logging.getLogger(__name__)


def _body(request):
    try:
        return json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Request body must be valid JSON")


def _error(message, status=400):
    return JsonResponse({"status": status, "error": message}, status=status)


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
        password = data.get("password", "")
        confirm = data.get("confirmPassword", data.get("password2", password))
        email = str(data.get("email", "")).strip()
        if not username or not password:
            return _error("Username and password are required")
        if password != confirm:
            return _error("Passwords do not match")
        if User.objects.filter(username__iexact=username).exists():
            return _error("Username is already registered", 409)
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=str(data.get("firstName", "")).strip(),
            last_name=str(data.get("lastName", "")).strip(),
        )
        login(request, user)
        return JsonResponse(
            {
                "status": "Authenticated",
                "userName": user.username,
                "firstName": user.first_name,
                "lastName": user.last_name,
            },
            status=201,
        )
    except ValueError as exc:
        return _error(str(exc))


@require_http_methods(["GET"])
def login_status(request):
    user = request.user
    return JsonResponse(
        {"isAuthenticated": user.is_authenticated, "userName": user.username if user.is_authenticated else ""}
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

    def response():
        dealers = get_request(endpoint)
        return JsonResponse({"status": 200, "dealers": dealers})

    return _proxy(response)


@require_http_methods(["GET"])
def get_dealer_details(request, dealer_id):
    def response():
        dealer = get_request(f"fetchDealer/{dealer_id}")
        return JsonResponse({"status": 200, "dealer": [dealer]})

    return _proxy(response)


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
    data["name"] = request.user.get_full_name().strip() or request.user.username
    required = ("dealership", "review", "purchase_date", "car_make", "car_model", "car_year")
    missing = [field for field in required if not str(data.get(field, "")).strip()]
    if missing:
        return _error(f'Missing fields: {", ".join(missing)}')

    def response():
        saved = post_review(data)
        return JsonResponse({"status": 201, "review": saved}, status=201)

    return _proxy(response)


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
