import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh", 
      backgroundColor: "#f6f6f7",
      fontFamily: "sans-serif"
    }}>
      <div style={{ 
        backgroundColor: "white", 
        padding: "40px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        maxWdith: "400px"
      }}>
        <h2 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "600" }}>Log in</h2>
        <Form method="post">
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Shop domain
            </label>
            <input
              name="shop"
              type="text"
              placeholder="example.myshopify.com"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d2d5d9",
                borderRadius: "4px",
                fontSize: "16px"
              }}
            />
            {errors.shop && (
              <p style={{ color: "#d21c1c", fontSize: "14px", marginTop: "4px" }}>
                {errors.shop}
              </p>
            )}
          </div>
          <button 
            type="submit" 
            style={{
              width: "100%",
              backgroundColor: "#008060",
              color: "white",
              padding: "12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px"
            }}
          >
            Log in
          </button>
        </Form>
      </div>
    </div>
  );
}
