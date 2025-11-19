// src/routes/index.tsx
import React from "react";
import { useRoutes } from "react-router-dom";

import { routesSection } from "./sections";

export default function Router() {
  console.log("[Router] render");
  const element = useRoutes(routesSection);
  console.log("[Router] element =", element);
  return element;
}
