# GeoAnalytica

**A full-stack geospatial analytics dashboard for exploring city amenities, comparing urban patterns, and turning spatial data into explainable insights.**

[Live demo](https://thegeodashboard.vercel.app) | [Backend API docs](https://gdashboardbackend.onrender.com/docs) | [Backend repository](https://github.com/heimweh17/gdashboardbackend)

GeoAnalytica is a portfolio project that combines an interactive map experience with an authenticated analytics workspace. A visitor can search a city, retrieve live OpenStreetMap amenity data, inspect statistical summaries, compare two cities on consistent study areas, and save places. Authenticated users can also upload point datasets for server-side spatial analysis.

## Engineering focus

The implementation focuses on the following production-oriented concerns:

- React state management and responsive mapping interactions.
- A FastAPI API with JWT authentication, protected resources, and request correlation.
- PostgreSQL persistence for user accounts, saved places, datasets, and analysis runs.
- Deterministic spatial metrics and clustering before any optional AI interpretation.
- Resilient integration with public geospatial services that can be slow or intermittently unavailable.
- Production deployment across Vercel, Render, and Neon.

## Product tour

### Explore live city amenities

Search a city, choose one or more amenity categories, and adjust the search radius or draw a custom polygon. The dashboard maps returned features, exposes raw OSM tags, supports category filtering, and summarizes the current result set.

![Interactive city amenity exploration](pics/Screenshot%202025-12-19%20175301.png)

The initial Orlando view includes a dated OpenStreetMap snapshot of restaurants within 1.5 km of the city center. The map labels this snapshot while requesting live data. A successful response replaces it, including when the live result is empty. Other study areas and layer selections use their own queries. Snapshot data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under ODbL.

### Compare urban patterns

The city comparison workflow queries the same amenity set across two study areas, then reports feature counts, density, diversity, nearest-neighbor distribution, cuisine variety, and chain versus independent business signals. Results can be exported for follow-up analysis.

![City comparison insights](pics/Screenshot%202025-11-26%20222431.png)

### Optional AI interpretation service

After an authenticated user uploads a CSV or GeoJSON point dataset and runs the deterministic analysis pipeline, the UI can request a Gemini summary of the saved analysis run for a human-readable narrative. The AI layer is an interpretation step, not the source of the underlying metrics.

![AI-assisted analysis narrative](pics/Screenshot%202025-12-19%20174500.png)

## Features

| Area | Current capabilities |
| --- | --- |
| Map exploration | City search, 26 amenity filters, adjustable radius, custom polygon search, marker popups, and category filtering. |
| Map visualization | Leaflet basemap, typed marker icons, heatmap mode, geolocation, and driving routes to selected places. |
| On-map analytics | Counts, category and subtype breakdowns, density, Shannon diversity, nearest-neighbor pattern classification, walkability proxy, accessibility tags, cuisine variety, and chain signals. |
| City comparison | Side-by-side study areas with normalized density and diversity comparisons plus CSV and JSON exports. |
| User workspace | Email/password registration, JWT sessions, saved-place CRUD, profile summary, and protected API routes. |
| Dataset analytics | Authenticated CSV or GeoJSON upload, coordinate parsing, bounding box detection, grid-density calculation, DBSCAN clustering, and persisted analysis results. |
| AI integration | The main API generates structured Gemini summaries with a database-backed per-user limit. |

## Architecture

```text
                         OpenStreetMap ecosystem
                    Nominatim / Overpass / OSM tiles
                                  |
                                  v
Browser -> Vercel-hosted React SPA -> Render FastAPI API -> Neon PostgreSQL
   |             |                       |                      |
   |             |                       |                      +-- users, saved places,
   |             |                       |                          datasets, analysis runs
   |             |                       +-- JWT auth, upload parsing, DBSCAN,
   |             |                           grid-density analysis, AI summaries
   |             +-- Leaflet, React, Recharts, interactive controls
   |
   +-- OSRM route service for selected amenities

Render FastAPI -> Gemini API (on explicit summary requests)
```

### Deployed services

| Service | Responsibility |
| --- | --- |
| [Vercel](https://thegeodashboard.vercel.app) | Serves the Vite/React single-page application. |
| [Render](https://gdashboardbackend.onrender.com/docs) | Runs the public FastAPI API for authentication, saved places, data uploads, analysis, and city search. |
| [Neon](https://neon.com) | Provides the persistent PostgreSQL database used by the deployed API. |
| OpenStreetMap services | Supply basemap, geocoding, and amenity data. |
| OSRM | Provides driving routes for selected map features. |

### AI configuration

Set GEMINI_API_KEY on the Render backend and redeploy. Sign in, upload a point dataset, run analysis, then select **Interpret with Gemini**. One successful summary is available per user per rolling seven days. The key stays on the server.

The former AWS service entry point (app.ai_main:app) and proxy are retained in the backend repository. To deliberately restore split deployment, configure AI_MODE=remote and AI_SERVICE_URL on the core API and the Gemini key on the standalone service. Embedded mode is the default, including when an old upstream URL is present.

## Data flow and engineering choices

1. **City lookup** is served through the FastAPI `/osm/cities` endpoint, which calls Nominatim with an application user agent. This keeps the browser clear of geocoder CORS constraints.
2. **Amenity discovery** uses Overpass queries for nodes, ways, and relations within either a radius or a drawn polygon. The API validates layer names and coordinates, translates layers to OSM tags and tries alternate Overpass endpoints after upstream failures.
3. **Client-side city analytics** computes comparable statistics from the returned OSM feature set. This keeps immediate map interaction responsive while making the calculation logic inspectable in the frontend.
4. **Authenticated dataset analytics** sends user-provided CSV or GeoJSON files to FastAPI. The API validates the file type, detects coordinates, calculates a bounding box and summary statistics, runs grid-density and DBSCAN calculations, and records the result in PostgreSQL.
5. **AI interpretation** loads a saved run scoped to the signed-in user, sends summary metrics to Gemini and records successful usage.

## Reliability and security highlights

- Passwords are hashed with Argon2; protected API routes use signed JWT bearer tokens.
- Saved places, datasets, and analysis runs are scoped to the authenticated user in both route handlers and database queries.
- The frontend retries temporary authentication gateway failures and presents a connection state while the free API service wakes up.
- Map tile configuration supports CARTO when an API key is present and falls back to OpenStreetMap tiles otherwise, preserving a functional map without embedding a key in the repository.
- The FastAPI service configures explicit CORS origins for the production frontend and local development.
- Request IDs correlate backend requests with structured logs.

## Tech stack

**Frontend**

- React 19, TypeScript, Vite
- React Leaflet, Leaflet Draw, Leaflet Heat
- Recharts, Tailwind CSS, Lucide
- Axios and browser Fetch APIs

**Backend**

- Python, FastAPI, Uvicorn
- SQLAlchemy 2, Pydantic, Alembic
- PostgreSQL, Neon, psycopg2
- NumPy and scikit-learn for spatial analysis
- python-jose and Argon2 password hashing
- Gemini REST API for optional dataset interpretation

**Platform and data integrations**

- Vercel, Render, Neon PostgreSQL
- OpenStreetMap, Nominatim, Overpass, OSRM

## Local development

The deployed frontend and API live in separate repositories. Start the backend first, then point the frontend at it.

## Local platform environment

The [`infra/`](infra/README.md) directory adds a cost-contained local platform environment without changing the public Vercel, Render, or Neon deployment. It includes kind Kubernetes manifests, an Alembic migration job, Prometheus/Grafana observability resources, GitHub Actions validation, and an optional Terraform AWS ECR bootstrap module.

### 1. Run the API

```powershell
git clone https://github.com/heimweh17/gdashboardbackend.git
cd gdashboardbackend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

$env:SECRET_KEY = "replace-with-a-local-secret"
$env:CORS_ORIGINS = "http://localhost:5173"
# Omit DATABASE_URL to use local SQLite, or uncomment this line for PostgreSQL.
# $env:DATABASE_URL = "postgresql://user:password@localhost:5432/geodashboard"

uvicorn app.main:app --reload
```

### 2. Run the frontend

```powershell
git clone https://github.com/heimweh17/Geo-Dashboard.git
cd Geo-Dashboard
npm ci
Copy-Item env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:8000 in .env.local
npm run dev
```

Useful commands:

```powershell
npm run build
npm run lint
```

### Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend, local development | FastAPI base URL. Production uses the deployed Render API. |
| `VITE_CARTO_API_KEY` | Frontend, optional | Enables CARTO raster tiles. Without it, the app uses OpenStreetMap tiles. |
| `DATABASE_URL` | Backend | PostgreSQL connection string. Omit locally to use SQLite. |
| `SECRET_KEY` | Backend | Secret for JWT signing. |
| `CORS_ORIGINS` | Backend | Comma-separated allowed frontend origins. |
| `AI_SERVICE_URL` | Backend, remote mode only | Upstream endpoint for AI narrative generation. |
| `GEMINI_API_KEY` | Backend | Credential used by the Gemini integration. |
| `GEMINI_MODEL` | Backend, optional | Preferred Gemini model name. |

## Public data and attribution

The map and amenity workflow depends on public, third-party services. Data coverage, tagging completeness, and availability can vary by location and provider. The application keeps OpenStreetMap attribution visible on the map as required by the tile provider and OpenStreetMap terms.

## Repository notes

The Vercel deployment is built from the React client in `src/`. The production FastAPI service is maintained in the separate [gdashboardbackend repository](https://github.com/heimweh17/gdashboardbackend). The service boundaries are explicit: the browser calls FastAPI, which owns persistence, spatial analysis and Gemini integration.

## Author

**Alex Liu**

Computer Science, University of Florida

[Portfolio](https://aliu.me) | [GitHub](https://github.com/heimweh17)
