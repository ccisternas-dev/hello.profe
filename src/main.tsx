import React, { lazy, Suspense } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { I18nProvider } from "./i18n"
import "./index.css"

// Vite removes this development-only import from production builds.
const Screen = import.meta.env.DEV && new URLSearchParams(window.location.search).has("design-system")
  ? lazy(() => import("./DesignSystem"))
  : App

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <Suspense fallback={null}><Screen /></Suspense>
    </I18nProvider>
  </React.StrictMode>,
)
