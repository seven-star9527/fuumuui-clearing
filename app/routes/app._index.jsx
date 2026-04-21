import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/app/gwp-config");
  }, [navigate]);

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#202223" }}>Loading GWP Configuration...</h2>
      <p style={{ marginTop: "16px", color: "#6d7175", fontSize: "16px" }}>
        If you are not redirected automatically,{" "}
        <Link to="/app/gwp-config" style={{ color: "#008060", textDecoration: "underline", fontWeight: "600" }}>
          click here to continue
        </Link>.
      </p>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
