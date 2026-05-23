import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// HashRouter is required for Electron production builds.
// When Electron loads via loadFile(), the URL uses the file:// protocol and
// BrowserRouter reads window.location.pathname as the filesystem path
// (e.g. /Users/.../renderer/dist/index.html), causing no routes to match
// and a blank main content area. HashRouter stores routes in the URL hash
// (#/chats, #/login), which is protocol-independent and works with file://.
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";

// Popup call windows (window.opener is set) do NOT need StrictMode.
// StrictMode's double-invoke causes the mock cleanup to fire, which posts
// CALL_ENDED via BroadcastChannel and makes the main window close the popup.
const isPopupWindow = !!window.opener;

const AppTree = (
  <HashRouter>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </HashRouter>
);

createRoot(document.getElementById("root")).render(
  isPopupWindow ? AppTree : <StrictMode>{AppTree}</StrictMode>
);
