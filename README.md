# Best Cars Dealership Capstone

Best Cars is the IBM Full Stack Software Developer Capstone application. It lets visitors browse dealerships and customer reviews, filter dealers by state, register and sign in, and submit vehicle purchase reviews. Django authenticates users and coordinates the React client, the Express/MongoDB data API, and the VADER sentiment microservice.

Repository: <https://github.com/hoanganhdo2316-png/xrwvm-fullstack_developer_capstone>

## Features

- Responsive Home, About Us, and Contact Us pages with consistent navigation.
- Django registration, login, logout, and session-status APIs with hashed passwords.
- Dealer directory with data-backed state filtering and an All states option.
- Dealer details and customer reviews with positive, neutral, and negative indicators.
- Authenticated review submission with purchase status, date, make, model, year, and review text.
- Express/Mongoose data validation and seed-on-empty MongoDB initialization.
- Offline VADER sentiment analysis using the bundled lexicon.
- Multi-stage Docker builds, Kubernetes resources, and GitHub Actions checks.

## Architecture and ports

| Component | Responsibility | Port |
| --- | --- | --- |
| React | Browser routes and interactive user flows | 3000 in development |
| Django/Gunicorn | Static pages, sessions, vehicle reference data, API proxy | 8000 |
| Express | Dealership and review persistence API | 3030 |
| MongoDB | Dealership and review collections | 27017 |
| Flask/Gunicorn | VADER sentiment classification | 5050 |

Request flow:

```text
Browser -> Django /djangoapp/* -> Express -> MongoDB
                            \-> Sentiment service
```

Django serves the production React bundle from `server/frontend/build` and static marketing assets through WhiteNoise. Its container applies database migrations before starting Gunicorn.

## Repository structure

```text
.github/workflows/ci.yml           Continuous integration
kubernetes/                        MongoDB, Express, sentiment, and web manifests
server/Dockerfile                  React build + Django/Gunicorn image
server/djangoapp/                  Models, views, API helpers, tests, sentiment service
server/djangoproj/                 Django settings and root URLs
server/database/                   Express/Mongoose service and seed data
server/frontend/                   React application and static HTML pages
.env.example                       Safe configuration reference
CAPSTONE_COMPLETION_REPORT.md      Rubric and evidence guide
```

## Prerequisites

- Python 3.11 or a compatible current Python 3 release
- Node.js 18 and npm
- MongoDB 7, or Docker Compose
- Docker and kubectl only for container/deployment work

## Environment variables

Use [.env.example](.env.example) as the reference. Do not store real credentials in Git.

| Variable | Purpose | Safe local default |
| --- | --- | --- |
| `EXPRESS_BACKEND_URL` | Django-to-Express base URL | `http://localhost:3030` |
| `SENTIMENT_ANALYZER_URL` | Django-to-Flask base URL | `http://localhost:5050` |
| `UPSTREAM_TIMEOUT_SECONDS` | Proxy timeout | `8` |
| `DJANGO_SECRET_KEY` | Django cryptographic secret; required when debug is false | local fallback only in debug |
| `DJANGO_DEBUG` | Django debug mode | `true` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Comma-separated HTTPS origins | empty |
| `DJANGO_SECURE_COOKIES` | Secure session and CSRF cookies | false locally |
| `DJANGO_SECURE_SSL_REDIRECT` | Redirect HTTP to HTTPS | false locally |
| `DJANGO_SECURE_HSTS_SECONDS` | HSTS duration | `0` locally |
| `MONGODB_URL` | Express MongoDB connection | Compose service URL |
| `PORT` | Express port | `3030` |

The tracked `server/djangoapp/.env` contains local service URLs only, not credentials. Deployment environment variables override those values.

## Local setup

### Django

```bash
cd server
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py shell -c "from djangoapp.populate import initiate; print(initiate())"
python manage.py runserver 8000
```

### MongoDB and Express

The simplest option starts both services:

```bash
docker compose -f server/database/docker-compose.yml up --build
```

For an existing local MongoDB:

```bash
cd server/database
npm ci
# PowerShell: $env:MONGODB_URL='mongodb://localhost:27017/dealershipsDB'
# Bash: export MONGODB_URL='mongodb://localhost:27017/dealershipsDB'
npm start
```

Express seeds the supplied dealer and review JSON only when the corresponding collections are empty.

### Sentiment service

```bash
cd server/djangoapp/microservices
python -m pip install -r requirements.txt
python app.py
```

No interactive NLTK download is needed; `sentiment/vader_lexicon.zip` is included.

### React development server

```bash
cd server/frontend
npm ci
npm start
```

The package proxy forwards `/djangoapp` calls to Django at `http://localhost:8000`.

## Routes and endpoints

### Browser routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/about` | About Us |
| `/contact` | Contact Us |
| `/login` | Login |
| `/register` | Registration |
| `/dealers` | Dealer directory |
| `/dealer/:id` | Dealer details and reviews |
| `/postreview/:id` | Protected review form |

### Django JSON endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/djangoapp/health` | Web service health |
| POST | `/djangoapp/register` | Register and start a session |
| POST | `/djangoapp/login` | Authenticate |
| POST/GET | `/djangoapp/logout` | End session |
| GET | `/djangoapp/loginstatus` | Current session state |
| GET | `/djangoapp/get_dealers[/<state>]` | Dealer list/filter |
| GET | `/djangoapp/dealer/<id>` | Dealer details |
| GET | `/djangoapp/reviews/dealer/<id>` | Reviews plus sentiment |
| POST | `/djangoapp/add_review` | Authenticated review submission |
| GET | `/djangoapp/get_cars` | Car makes and models |

### Express and sentiment endpoints

- Express: `/health`, `/fetchDealers`, `/fetchDealers/:state`, `/fetchDealer/:id`, `/fetchReviews`, `/fetchReviews/dealer/:id`, and `POST /insert_review`.
- Sentiment: `GET /`, `POST /analyze` with `{"text":"..."}`, and the lab-compatible `GET /analyze/<text>`.

## Docker images

```bash
docker build -t dealership-web server
docker build -t database-api server/database
docker build -t sentiment server/djangoapp/microservices
docker build -t dealership-frontend server/frontend
```

The standalone Nginx frontend image is optional. The deployed `dealership-web` image already contains the production React bundle.

## Kubernetes and IBM Cloud

The manifests preserve the grading deployment image names:

- `us.icr.io/sn-labs-hoanganhdo23/dealership-web:latest`
- `us.icr.io/sn-labs-hoanganhdo23/database-api:latest`
- `us.icr.io/sn-labs-hoanganhdo23/sentiment:latest`

Create the Django Secret without putting its value in Git:

```bash
kubectl create secret generic dealership-secrets --from-literal=django-secret-key='REPLACE_LOCALLY'
kubectl apply -f kubernetes/database.yaml
kubectl apply -f kubernetes/sentiment.yaml
kubectl apply -f kubernetes/web.yaml
kubectl get deployments,pods,services
```

`dealership-web` is intentionally a `ClusterIP` service. Expose it using the route, Ingress, port-forward, or service type required by the current IBM Skills Network lab. MongoDB uses `emptyDir` for a lightweight lab deployment, so its data resets if that pod is replaced; use a PersistentVolumeClaim for a durable non-lab deployment.

## Validation

```bash
cd server
python -m compileall -q djangoapp djangoproj
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
python -m unittest djangoapp.microservices.test_app
flake8 djangoapp djangoproj --max-line-length=120 --exclude=migrations --jobs=1

cd frontend
npm ci
npm run build

cd ../database
npm ci
npm test
```

CI runs these meaningful checks on pushes and pull requests targeting `main`. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Security notes

- Django hashes passwords through its authentication framework; the registration UI validates all rubric fields while the API remains compatible with the lab's minimal username/password payload.
- Production startup fails when `DJANGO_DEBUG=false` and `DJANGO_SECRET_KEY` is absent.
- Review authorship is taken from the authenticated session, not trusted from browser input.
- Service URLs and secrets are environment-driven. `kubernetes/secret.example.yaml` is a template only.
- Do not commit IBM Cloud API keys, registry tokens, kubeconfig files, generated Secrets, or evidence containing credentials.

## Grading evidence

See [CAPSTONE_COMPLETION_REPORT.md](CAPSTONE_COMPLETION_REPORT.md) for the rubric checklist, exact code locations, suggested screenshots, GitHub links, and terminal evidence commands. Cloud availability is not claimed by this README; capture current IBM Cloud evidence immediately before submission.

## License

Apache License 2.0. Original course starter attribution is retained in [LICENSE](LICENSE).
