import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { Capacitor } from "@capacitor/core";

// The public guide belongs to the website, rather than the native wheel workspace
// or a private shared snapshot. Keep its server-rendered content on the homepage.
const guide = document.getElementById("wheel-guide");
if (guide && (Capacitor.isNativePlatform() || !["/", "/index.html"].includes(window.location.pathname))) guide.remove();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
