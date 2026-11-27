# Deployment

Vercel builds the React application in this repository with npm run build. Set VITE_API_BASE_URL to https://gdashboardbackend.onrender.com in Vercel. Vite embeds the address at build time, so redeploy the frontend after changing it. Verify the destination in the browser network panel when searching for a city.

Render runs app.main:app from [Geography Dashboard Backend](https://github.com/heimweh17/Geography-Dashboard-Backend). Its DATABASE_URL points to Neon PostgreSQL. Keep SECRET_KEY and NAVIGATOR_TOOLKIT_API_KEY in the Render service environment. Save and redeploy after changing a key.

See the [project guide](README.MD) for configuration, the optional standalone AI entry point, and local startup. See the [platform guide](infra/README.md) for Kubernetes.

## Visitor analytics

The production client loads Vercel Web Analytics only on `thegeodashboard.vercel.app`. Enable Web Analytics in this site's Vercel project. The map uses `/` and the city comparison workspace uses `/compare`, including navigation from the sidebar.

To enable Statcounter, create a dedicated Basic project for the production URL. Select invisible tracking, disable public reports and session recording, then set `VITE_STATCOUNTER_PROJECT_ID` and `VITE_STATCOUNTER_SECURITY` in Vercel's Production environment and redeploy. Use the public installation values from that project's snippet. View the visitor map in the Statcounter account.
