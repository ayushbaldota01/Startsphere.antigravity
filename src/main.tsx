import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { performanceMonitor } from "./lib/performance";

// Mark app initialization start
performanceMonitor.mark('app-init-start');

// Render app
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Mark app initialization end
performanceMonitor.mark('app-init-end');
performanceMonitor.measureBetween('app-initialization', 'app-init-start', 'app-init-end');
