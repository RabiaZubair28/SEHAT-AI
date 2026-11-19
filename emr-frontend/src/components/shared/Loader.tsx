import React from "react";
import { Spin } from "antd";

const Loader: React.FC<{}> = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)", // Centering the loader
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.3)", // Transparent background
        width: "100vw", // Ensures full screen width
        height: "100vh", // Ensures full screen height
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden", // Prevent scrolling on the loader screen
      }}
    >
      <Spin size="large" />
    </div>
  );
};

export default Loader;
