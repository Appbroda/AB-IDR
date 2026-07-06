import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SnackbarProvider } from "notistack";

import Layout from "./components/Layout";
import Applovin from "./pages/Applovin";
import Ironsource from "./pages/Ironsource";
import TradPlus from "./pages/Tradplus";

import applovinLogo from "./assets/applovin.png";
import ironsourceLogo from "./assets/ironsource.png";
import tradplusLogo from "./assets/tradplus.png";

import { ToastBridge } from "./components/ToastBridge";

const sidebarMenuOptions = [
  {
    path: "/applovin",
    label: "Applovin",
    icon: (
      <img
        src={applovinLogo}
        alt="AppLovin MAX Logo"
        style={{ width: "20px", height: "20px", objectFit: "contain" }}
      />
    ),
  },
  {
    path: "/ironsource",
    label: "Ironsource",
    icon: (
      <img
        src={ironsourceLogo}
        alt="IronSource Logo"
        style={{ width: "20px", height: "20px", objectFit: "contain" }}
      />
    ),
  },
  {
    path: "/tradplus",
    label: "TradPlus",
    icon: (
      <img
        src={tradplusLogo}
        alt="TradPlus Logo"
        style={{ width: "20px", height: "20px", objectFit: "contain" }}
      />
    ),
  },
];

export default function App() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <ToastBridge />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout navItems={sidebarMenuOptions} />}>
            <Route index element={<Navigate to="/applovin" replace />} />
            <Route path="applovin" element={<Applovin />} />
            <Route path="ironsource" element={<Ironsource />} />
            <Route path="tradplus" element={<TradPlus />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
}
