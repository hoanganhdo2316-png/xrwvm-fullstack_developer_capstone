# Best Cars Dealership Capstone Preparation

This repository is a locally runnable implementation of the IBM Full Stack Software Developer capstone starter. It combines static marketing pages, a React client, a Django session/authentication and proxy layer, an Express/MongoDB dealership service, and a Flask/VADER sentiment service.

## Architecture and ports

| Service | Purpose | Local port |
| --- | --- | --- |
| React development server | Browser UI | 3000 |
| Django / Gunicorn | Authentication, vehicle models, static pages, API proxy | 8000 |
| Express | Dealership and review API | 3030 |
| MongoDB | Dealer/review persistence | 27017 |
| Flask / Gunicorn | Sentiment classification | 5050 |

The browser calls `/djangoapp/*`. Django keeps the authenticated session, proxies dealer/review calls to Express, and enriches reviews with sentiment from Flask. Express stores dealership and review data in MongoDB and seeds the provided JSON only when collections are empty. Django stores users and car make/model reference data in SQLite for local development.

## Environment

Copy `.env.example` to an untracked `.env` or export its values. Required deployment values are:

- `DJANGO_SECRET_KEY`: a long random production secret.
- `DJANGO_DEBUG`: `false` outside local development.
- `DJANGO_ALLOWED_HOSTS`: comma-separated public hostnames.
- `DJANGO_CSRF_TRUSTED_ORIGINS`: comma-separated HTTPS origins when needed.
- `EXPRESS_BACKEND_URL`: Express base URL, default `http://localhost:3030`.
- `SENTIMENT_ANALYZER_URL`: sentiment base URL, default `http://localhost:5050`.
- `MONGODB_URL`: MongoDB connection string, default Compose service URL.
- `UPSTREAM_TIMEOUT_SECONDS`: Django proxy timeout, default `8`.

No real credentials belong in the tracked `.env.example` or Kubernetes example Secret.

## Local setup

Use Python 3.11+ and Node 18.

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py shell -c "from djangoapp.populate import initiate; print(initiate())"
python manage.py runserver 8000
```

In separate terminals:

```powershell
cd server\database
npm install
# Start MongoDB first, or use: docker compose up --build
$env:MONGODB_URL='mongodb://localhost:27017/dealershipsDB'
npm start
```

```powershell
cd server\djangoapp\microservices
pip install -r requirements.txt
python app.py
```

```powershell
cd server\frontend
npm ci
$env:REACT_APP_API_URL='http://localhost:8000'
npm start
```

The declared Create React App development proxy sends relative `/djangoapp` calls to Django on port 8000. The static Home, About, and Contact pages are available directly from Django at `/`, `/about`, and `/contact`.

## Docker

- `server/database/docker-compose.yml` runs MongoDB and Express together.
- `server/djangoapp/microservices/Dockerfile` builds the offline VADER service; the lexicon is included in the image.
- `server/Dockerfile` builds the React bundle and Django/Gunicorn image.
- `server/frontend/Dockerfile` is an optional standalone Nginx React image.

Build examples:

```powershell
docker compose -f server/database/docker-compose.yml up --build
docker build -t sentiment server/djangoapp/microservices
docker build -t dealership-web server
```

## Kubernetes and IBM Cloud deployment

Manifests are in `kubernetes/`. Before applying them:

1. Replace every `REPLACE_REGISTRY/REPLACE_NAMESPACE/...` image reference with images pushed to the lab registry.
2. Create `dealership-secrets` from a real Django secret; do not apply `secret.example.yaml` unchanged.
3. Replace the lab-only `emptyDir` MongoDB volume with persistent storage if data must survive pod replacement.
4. Add an Ingress/Route or change the web Service type to the mechanism required by the Coursera IBM Cloud environment.
5. Set real allowed hosts and trusted HTTPS origins in the ConfigMap.

Example: `kubectl apply -f kubernetes/database.yaml -f kubernetes/sentiment.yaml -f kubernetes/web.yaml` after images and the Secret exist.

## Validation

```powershell
cd server
python manage.py check
python manage.py makemigrations --check --dry-run
flake8 djangoapp djangoproj --max-line-length=120 --exclude=migrations --jobs=1

cd frontend
npm ci
npm run build

cd ..\database
npm install
npm test
```

The GitHub Actions workflow performs the Django, React, and Express checks on push and pull requests. Deployment and live MongoDB integration remain environment-dependent and are intentionally not claimed as local successes.
