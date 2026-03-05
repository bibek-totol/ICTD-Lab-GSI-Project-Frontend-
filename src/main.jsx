import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { RouterProvider } from "react-router";
import router from "./Routes/Router.jsx";
import "./components/languages/language/i18n.js";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import axios from "axios";
import AuthService from "./services/auth.service.js";

// Global Axios: attach token only if not expired (5h security); always send language
axios.interceptors.request.use(
  (config) => {
    if (!AuthService.isTokenExpired()) {
      const token = localStorage.getItem(AuthService.AUTH_STORAGE_KEYS.TOKEN);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = localStorage.getItem("appLanguage") || "bn";
    config.headers["Accept-Language"] = lang;
    return config;
  },
  (error) => Promise.reject(error)
);

//  Create client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster position="top-center" reverseOrder={false} />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>
);

