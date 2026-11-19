import React from "react";
import ServiceCard from "./components/ServiceCard";
import TopBar from "@/components/ui/TopBar";

const Service: React.FC = () => {
  return (
    <>
      <TopBar
        title="Services"
        onIconClick={() => console.log("Back clicked")}
        showPatientInfo={true}
      />
      <br />
      <br />
      <ServiceCard />
    </>
  );
};

export default Service;
