import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import translations from "@shopify/polaris/locales/en.json";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const host = url.searchParams.get("host");

  return { 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: host || ""
  };
};

export default function App() {
  const { apiKey, host } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey} i18n={translations} host={host}>
      <meta name="shopify-api-key" content={apiKey} />
      <NavMenu>
        <a href="/app" rel="home">Home</a>
        <a href="/app/additional">Additional page</a>
        <a href="/app/gwp-config">🎁 GWP Config</a>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
