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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      {/* 核心修复：如果检测到在 Iframe 中，强制顶层窗口跳转 */}
      <script dangerouslySetInnerHTML={{ __html: `
        if (window.top !== window.self) {
          window.top.location.href = window.location.href;
        }
      `}} />
      
      <div style={{ 
        backgroundColor: "white", 
        padding: "40px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#202223" }}>Log in</h2>
          <p style={{ color: "#6d7175", marginTop: "8px" }}>Enter your shop domain to continue</p>
        </div>

        <Form method="post">
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#202223" }}>
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
                padding: "12px",
                border: errors.shop ? "1px solid #d21c1c" : "1px solid #d2d5d9",
                borderRadius: "4px",
                fontSize: "16px",
                boxSizing: "border-box"
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
              padding: "14px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "16px",
              transition: "background-color 0.2s"
            }}
          >
            Log in
          </button>
        </Form>
      </div>
    </div>
  );
}
