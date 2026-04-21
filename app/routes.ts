import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("app._index.jsx"),
  route("app", "app.jsx"),
  route("app/gwp-config", "app.gwp-config.jsx"),
  route("app/gwp-config/:action", "app.gwp-config.$action.jsx"),
  route("app/uninstalled", "webhooks.app.uninstalled.jsx"),
  route("app/scopes_update", "webhooks.app.scopes_update.jsx"),
] satisfies RouteConfig;
