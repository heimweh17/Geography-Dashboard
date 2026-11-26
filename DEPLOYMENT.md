# Deployment

Vercel builds the React application in this repository with npm run build. Set VITE_API_BASE_URL to https://gdashboardbackend.onrender.com in Vercel. Vite embeds the address at build time, so redeploy the frontend after changing it. Verify the destination in the browser network panel when searching for a city.

Render runs app.main:app from [gdashboardbackend](https://github.com/heimweh17/gdashboardbackend). Its DATABASE_URL points to Neon PostgreSQL. Keep SECRET_KEY and NAVIGATOR_TOOLKIT_API_KEY in the Render service environment. Save and redeploy after changing a key.

See the [project guide](README.MD) for configuration, the optional standalone AI entry point, and local startup. See the [platform guide](infra/README.md) for Kubernetes.
