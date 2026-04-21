import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index/route.jsx"),
  route("app", "routes/app.jsx", [
    index("routes/app._index.jsx"),
    route("additional", "routes/app.additional.jsx"),
    route("gwp-config", "routes/app.gwp-config.jsx"),
  ]),
  route("auth/login", "routes/auth.login/route.jsx"),
  route("auth/*", "routes/auth.$.jsx"),
  route("webhooks/app/uninstalled", "routes/webhooks.app.uninstalled.jsx"),
  route("webhooks/app/scopes_update", "routes/webhooks.app.scopes_update.jsx"),
] satisfies RouteConfig;
