import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <PrivyProvider
    appId="cmo0l6m37001k0ckylqmtr3do"
    config={{
      loginMethods: ["email", "google"],
      appearance: {
        theme: "dark",
        accentColor: "#5CC8E8",
        loginMessage: "Sign in to Pacifica Pulse",
        showWalletLoginFirst: false,
      },
      embeddedWallets: {
        ethereum: { createOnLogin: "off" },
        solana: { createOnLogin: "off" },
      },
    }}
  >
    <App />
  </PrivyProvider>
);
