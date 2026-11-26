# Deployment

Vercel builds the React application in this repository with npm run build. Configure VITE_API_BASE_URL with the public Render API origin.

Render runs app.main:app from [gdashboardbackend](https://github.com/heimweh17/gdashboardbackend). Its DATABASE_URL points to Neon PostgreSQL. Keep SECRET_KEY and GEMINI_API_KEY in the Render service environment. Save and redeploy after changing a key.

See the [project guide](README.MD) for configuration, the optional standalone AI entry point, and local startup. See the [platform guide](infra/README.md) for Kubernetes.
