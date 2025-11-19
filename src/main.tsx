// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app";

console.log("[main] starting app");

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[main] no #root element found in index.html");
} else {
  console.log("[main] found #root, creating React root");

  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  console.log("[main] render() called");
}
