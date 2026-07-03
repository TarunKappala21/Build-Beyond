import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import "./index.css";
import "./styles/AdminGlobal.css";
import { ValidationProvider } from "./context/ValidationContext.jsx";
import { GlobalChatProvider } from "./context/GlobalChatContext.jsx";
import { Provider } from "react-redux";
import store from "./store";
import API_BASE from "./api/backendBase";

if (typeof window !== "undefined" && !window.__apiBaseFetchPatched__) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (!import.meta.env.PROD || !API_BASE) {
      return originalFetch(input, init);
    }

    if (typeof input === "string") {
      if (input.startsWith("/api/")) {
        return originalFetch(`${API_BASE}${input}`, init);
      }
      return originalFetch(input, init);
    }

    if (input instanceof Request) {
      const requestUrl = new URL(input.url);
      if (
        requestUrl.origin === window.location.origin &&
        requestUrl.pathname.startsWith("/api/")
      ) {
        const targetUrl = `${API_BASE}${requestUrl.pathname}${requestUrl.search}`;
        const nextRequest = new Request(targetUrl, input);
        return originalFetch(nextRequest, init);
      }
    }

    return originalFetch(input, init);
  };

  window.__apiBaseFetchPatched__ = true;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <ValidationProvider>
        <GlobalChatProvider>
          <App />
        </GlobalChatProvider>
      </ValidationProvider>
    </BrowserRouter>
  </Provider>,
);
