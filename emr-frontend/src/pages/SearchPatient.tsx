import React from "react";
import SearchPatient from "@/features/searchPatient/components/SearchPatientForm";
import { Outlet } from "react-router-dom";

const SearchPatientPage: React.FC = () => {
  return (
    <div>
      <SearchPatient />
      <Outlet />
    </div>
  );
};

export default SearchPatientPage;
