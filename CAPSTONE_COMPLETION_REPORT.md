# Capstone Completion Report

## 1. Executive summary

The repository was audited from clean commit `6d5c430` on branch `main`. The existing architecture and previously working IBM Container Registry image references were preserved. The project now covers the locally implementable Best Cars rubric: static company pages, React navigation and forms, Django session authentication and proxy APIs, Express/MongoDB dealership data, VADER sentiment classification, container definitions, Kubernetes workloads, CI checks, automated backend tests, and grader-oriented documentation.

No commit, push, cloud deployment, credential operation, or live workload mutation was performed. The local Docker daemon and Kubernetes cluster were unavailable, so prior cloud deployment remains a required evidence item rather than a claimed result.

## 2. Architecture summary

```text
React/static browser UI
        |
        v
Django/Gunicorn :8000
  | authentication + SQLite users/car reference data
  | proxy
  +----> Express :3030 ----> MongoDB :27017
  +----> Flask/VADER :5050
```

- Django serves Home, About, Contact, the built React entry point, static assets through WhiteNoise, and `/djangoapp/*` JSON endpoints.
- Express owns dealership/review persistence and seeds the supplied JSON only when collections are empty.
- Flask classifies review text with the bundled VADER lexicon and needs no runtime download.
- Kubernetes service discovery names match configured URLs: `database-api`, `mongo-db`, and `sentiment`.

## 3. Files modified

### Application and tests

- `server/requirements.txt`
- `server/Dockerfile`
- `server/database/Dockerfile`
- `server/database/app.js`
- `server/database/review.js`
- `server/djangoapp/urls.py`
- `server/djangoapp/views.py`
- `server/djangoapp/tests.py` (added)
- `server/djangoapp/microservices/test_app.py` (added)
- `server/djangoproj/settings.py`
- `server/djangoproj/urls.py` (removed an existing UTF-8 BOM)
- `server/frontend/public/index.html`
- `server/frontend/public/manifest.json`
- `server/frontend/src/components/Dealers/PostReview.jsx`
- `server/frontend/src/components/Pages/About.jsx`
- `server/frontend/src/components/Pages/Contact.jsx`
- `server/frontend/src/components/Register/Register.jsx`
- `server/frontend/src/components/assets/style.css`
- `server/frontend/static/Home.html`
- `server/frontend/static/About.html`
- `server/frontend/static/style.css`

### Deployment, CI, and documentation

- `.env.example`
- `.github/workflows/ci.yml`
- `kubernetes/database.yaml`
- `kubernetes/sentiment.yaml`
- `kubernetes/web.yaml`
- `README.md`
- `IMPLEMENTATION_REPORT.md`
- `CAPSTONE_COMPLETION_REPORT.md` (added)

No dependency lock file was changed.

## 4. Features verified

- Home, About, Contact, Login, Register, Dealers, Dealer detail, and Post Review routes resolve.
- About pages show three named team members, role, description, picture, and `@bestcars.com` email.
- Contact pages show address, phone, valid support email, and active navigation.
- The registration UI requires all rubric fields. Django validates supplied email and password confirmation, rejects duplicate usernames, and remains compatible with the lab's minimal username/password payload.
- Django hashes passwords and maintains a real authenticated session.
- Logout clears the server session and browser session metadata.
- Dealer list supports All states and API-backed state filtering.
- Dealer pages handle loading, missing data, no reviews, upstream errors, and sentiment icons.
- Review posting is session-protected and includes explicit purchase status, conditional date, make, model, year, and required text.
- Duplicate button submission is blocked while the request is pending.
- Django overwrites review author names from the authenticated user.
- Express validates dealer IDs, state length, review fields, car year, the presence of purchase dates when applicable, and malformed JSON while accepting legacy date strings already present in the supplied data.
- MongoDB seed data is preserved and only inserted into empty collections.
- Sentiment returns `positive`, `negative`, or `neutral` and rejects empty/malformed input.
- Production Django serves collected static assets via WhiteNoise and runs migrations before Gunicorn.
- Kubernetes selectors, labels, ports, service names, image names, probes, and environment variables are aligned.

## 5. Tests run

| Command | Result |
| --- | --- |
| `python -m compileall -q djangoapp djangoproj` | Passed |
| `python manage.py check` | Passed, 0 issues |
| `python manage.py makemigrations --check --dry-run` | Passed, no changes |
| `python manage.py collectstatic --noinput --clear` | Passed, 136 files copied and 400 post-processed |
| `python manage.py test` | Passed, 10 tests |
| `python -m unittest djangoapp.microservices.test_app` | Passed, 2 tests |
| `flake8 djangoapp djangoproj --max-line-length=120 --exclude=migrations --jobs=1` | Passed |
| `npm run build` in `server/frontend` | Passed with dependency/CSS deprecation warnings |
| Frontend Jest tests | Not run; the repository contains no frontend test files |
| `npm test` in `server/database` | Passed Node syntax checks |
| Express root, invalid-ID, malformed-JSON, and disconnected-health HTTP smoke test | Passed, 4 requests |
| Django test client for Home, About, Contact, and `/djangoapp/health` | Passed, HTTP 200 |
| Parse all JSON data/package files | Passed |
| Parse Kubernetes, Compose, and workflow YAML with PyYAML | Passed |
| `docker compose -f server/database/docker-compose.yml config --quiet` | Passed |
| `git diff --check` | Passed |

The React build reports one non-blocking Autoprefixer deprecation warning from the preserved starter `bootstrap.min.css`; there are no application ESLint warnings.

## 6. Failed or unavailable checks

| Check | Classification | Details |
| --- | --- | --- |
| Frontend Jest default worker mode | Sandbox limitation | The first test command failed with `spawn EPERM`; rerunning serially with `--runInBand` passed and confirmed that no frontend test files exist. |
| Docker image builds | Missing local infrastructure | Docker CLI exists, but the Docker Desktop Linux engine named pipe is unavailable. No image build was claimed. |
| `kubectl apply --dry-run=client` | Missing cluster context | Installed kubectl attempted API discovery at `localhost:8080`; no cluster was running. YAML parsing passed independently. |
| Browser screenshot/console automation | Missing browser connection | No in-app or Chrome browser was available in this session. HTTP route checks were used instead. |
| Live Express/MongoDB integration | Missing local MongoDB | Syntax, validation routes, Compose structure, schemas, and seed code were tested; live persistence requires MongoDB. |

## 7. Items requiring cloud verification

- Current IBM ICR images exist and match the latest source changes.
- Kubernetes Secret `dealership-secrets` exists without exposing its value.
- Deployments `dealership-web`, `database-api`, `mongodb`, and `sentiment` are Available.
- All pods are Running and Ready with the added probes.
- Services resolve internally and the web application is externally reachable using the lab's route/exposure method.
- A real end-to-end review persists through Express/MongoDB and displays sentiment after submission.
- GitHub Actions is green for the final pushed commit.

## 8. Known limitations

- Kubernetes MongoDB uses `emptyDir` for low-friction lab deployment; data does not survive MongoDB pod replacement. Use a PVC outside the lab.
- Django uses SQLite in the web container. It is sufficient for a single-replica lab but not a horizontally scaled production deployment.
- The standalone Nginx frontend image expects an upstream named `django`; the documented Kubernetes architecture deploys the combined `dealership-web` image instead.
- Existing Create React App dependencies report ecosystem deprecations/audit findings. They were not broadly upgraded because the task requires compatibility and minimal lock-file churn.
- Static team members share the provided starter portrait asset; every required person still has a rendered picture.

## 9. Security review

- No API keys, passwords, IBM Cloud tokens, kubeconfig data, or generated secret values were added.
- Production Django refuses to start without `DJANGO_SECRET_KEY` when debug is false.
- Passwords use Django hashing and are never logged or persisted in browser storage.
- Session and CSRF cookies can be secured by environment variables. The lab manifest leaves this opt-in so authentication also works when the assigned endpoint is HTTP-only; enable it for verified HTTPS deployments.
- Review identity is derived from the authenticated server session.
- Express returns generic database errors instead of internal exception details.
- Request size, required fields, types, ID formats, dates, and model string lengths are bounded.
- `kubernetes/secret.example.yaml` remains a placeholder template and must not be applied unchanged.
- The tracked `server/djangoapp/.env` contains non-sensitive localhost defaults only; real deployment values are injected through Kubernetes.

## 10. Grading evidence checklist

Base GitHub URL: `https://github.com/hoanganhdo2316-png/xrwvm-fullstack_developer_capstone`

| Rubric item | Status | Relevant files/routes | Suggested screenshot | Suggested GitHub URL / terminal evidence |
| --- | --- | --- | --- | --- |
| Repository and README | Complete | `README.md` | README overview and architecture | `/blob/main/README.md` |
| Home page | Complete | `static/Home.html`, `Pages/Home.jsx`, `/` | Full Home page with nav and CTA | `/blob/main/server/frontend/static/Home.html` |
| About heading/company description | Complete | `static/About.html`, `Pages/About.jsx`, `/about` | About heading and intro | `/blob/main/server/frontend/static/About.html` |
| Three employee profiles | Complete | same files | Maya, Jordan, and Sam cards in one screenshot | Same About URL |
| Employee pictures/names/roles/bios/emails | Complete | same files | Close readable About profiles | Same About URL |
| Contact address/phone/email | Complete | `static/Contact.html`, `Pages/Contact.jsx`, `/contact` | Contact page with active nav | `/blob/main/server/frontend/static/Contact.html` |
| React routing/navigation | Complete | `App.js`, `Header.jsx` | Navigate Home -> Dealers -> About | `/blob/main/server/frontend/src/App.js` |
| Registration UI | Complete | `Register.jsx`, `/register` | Completed form before submission | `/blob/main/server/frontend/src/components/Register/Register.jsx` |
| Registration backend | Complete | `views.py`, `/djangoapp/register` | Successful registration/session UI | `/blob/main/server/djangoapp/views.py`; `python manage.py test djangoapp.tests.AuthenticationApiTests` |
| Login/logout/session | Complete | `Login.jsx`, `Header.jsx`, `views.py` | Logged-in username and Logout control | Same files; `python manage.py test` |
| Dealer list | Complete | `Dealers.jsx`, `/dealers` | Populated table | `/blob/main/server/frontend/src/components/Dealers/Dealers.jsx` |
| State filter and All states | Complete | `Dealers.jsx`, `/djangoapp/get_dealers/<state>` | Filter dropdown plus filtered rows | Same Dealers URL |
| Dealer details | Complete | `Dealer.jsx`, `/dealer/<id>` | Dealer heading/address | `/blob/main/server/frontend/src/components/Dealers/Dealer.jsx` |
| Dealer reviews | Complete | `Dealer.jsx`, `/djangoapp/reviews/dealer/<id>` | Multiple review panels | Same Dealer URL |
| Sentiment display | Complete | `Dealer.jsx`, sentiment `app.py` | Positive/neutral/negative icon beside review | `/blob/main/server/djangoapp/microservices/app.py`; `python -m unittest djangoapp.microservices.test_app` |
| Protected review form | Complete | `PostReview.jsx`, `add_review` | Logged-in review form | `/blob/main/server/frontend/src/components/Dealers/PostReview.jsx` |
| Review fields/purchase status | Complete | `PostReview.jsx` | Checkbox, date, vehicle, year, review | Same PostReview URL |
| Review submission/persistence | Not verifiable locally | Django `add_review`, Express `/insert_review`, MongoDB | Submitted review visible after redirect | `kubectl logs deployment/database-api`; deployed application screenshot |
| Car make/model models | Complete | `models.py`, migration, `populate.py` | Django admin car makes/models | `/blob/main/server/djangoapp/models.py`; `python manage.py check` |
| Express all dealers | Complete | `app.js`, `/fetchDealers` | JSON or app dealer list | `/blob/main/server/database/app.js` |
| Express dealer by state | Complete | `app.js`, `/fetchDealers/:state` | Filtered JSON | Same app.js URL |
| Express dealer by ID | Complete | `app.js`, `/fetchDealer/:id` | Dealer JSON | Same app.js URL |
| Express dealer reviews | Complete | `app.js`, `/fetchReviews/dealer/:id` | Review JSON | Same app.js URL |
| Express insert review | Complete; persistence cloud verification needed | `app.js`, `review.js` | POST response/log | Same files; deployed API log |
| MongoDB seed data | Complete | `data/*.json`, `seedIfEmpty()` | Database collections/counts | `/tree/main/server/database/data`; `kubectl logs deployment/database-api` |
| Sentiment microservice | Complete | microservice `app.py`, Dockerfile | JSON sentiment response | `/tree/main/server/djangoapp/microservices` |
| Django web Docker image | Complete; build needs daemon | `server/Dockerfile` | Successful `docker build` output or ICR image | `/blob/main/server/Dockerfile`; `ibmcloud cr images` |
| Database API Docker image | Complete; build needs daemon | `server/database/Dockerfile` | Image list | `/blob/main/server/database/Dockerfile`; `ibmcloud cr images` |
| Sentiment Docker image | Complete; build needs daemon | microservice Dockerfile | Image list | `/blob/main/server/djangoapp/microservices/Dockerfile`; `ibmcloud cr images` |
| Nginx frontend Dockerfile/config | Complete; optional image | frontend Dockerfile and `nginx.conf` | Build output if rubric asks | `/tree/main/server/frontend` |
| Kubernetes MongoDB | Complete; runtime cloud verification needed | `kubernetes/database.yaml` | `mongodb` pod and service | `/blob/main/kubernetes/database.yaml`; `kubectl get pods,svc` |
| Kubernetes database API | Complete; runtime cloud verification needed | same manifest | `database-api` Ready | Same URL; `kubectl get deployment database-api` |
| Kubernetes sentiment | Complete; runtime cloud verification needed | `sentiment.yaml` | sentiment Ready | `/blob/main/kubernetes/sentiment.yaml` |
| Kubernetes web | Complete; runtime cloud verification needed | `web.yaml` | dealership-web Ready and app URL | `/blob/main/kubernetes/web.yaml` |
| IBM registry references | Complete | all Kubernetes deployments | ICR image list | `ibmcloud cr images --restrict sn-labs-hoanganhdo23` |
| GitHub Actions CI | Complete; final run requires push | `.github/workflows/ci.yml` | Green workflow jobs | `https://github.com/hoanganhdo2316-png/xrwvm-fullstack_developer_capstone/actions` |
| Secrets excluded | Complete | `.gitignore`, `.env.example`, secret template | GitHub tree showing templates only | `/blob/main/.env.example`; `git grep -n -i 'api[_-]key\|token\|password'` review |
| Local validation | Complete | tests and CI | Terminal showing 10 + 2 tests and build | Commands in README Validation section |
| Live application URL | Not verifiable locally | external route required | Browser address bar plus working app | `kubectl get ingress,route,svc` in IBM lab |

## 11. Recommended evidence collection order

1. Open the final deployed URL and capture Home, About, Contact, Register, Login, Dealer list, state filter, dealer reviews, and submitted review screenshots.
2. Capture the sentiment icon on the newly submitted review.
3. Capture `ibmcloud cr images --restrict sn-labs-hoanganhdo23` showing all three images.
4. Capture `kubectl get deployments,pods,services` showing four healthy workloads.
5. Capture `kubectl logs deployment/dealership-web --tail=50` and `kubectl logs deployment/database-api --tail=50` without exposing secrets.
6. Push only after reviewing the diff, then capture the green GitHub Actions run.
7. Use stable GitHub file URLs from the checklist in the Coursera submission.

Do not add an external `django_server` artifact automatically. If the rubric explicitly requests it, inspect it for credentials and personal data before adding it.
