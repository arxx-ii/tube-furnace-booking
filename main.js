import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    React.createElement("div", { style: { padding: "24px" } },
      React.createElement("h1", { style: { fontSize: "24px", fontWeight: 700 } }, "Tube Furnace Booking"),
      React.createElement("p", { style: { marginTop: "8px", color: "#374151" } },
        "If you can see this, GitHub Pages is working and React is mounted."
      )
    )
  );
}

createRoot(document.getElementById("root")).render(React.createElement(App));
