import React from "react";
import { useNavigate } from "react-router-dom";
import AddFacilities from "@/features/admin/facilities/components/AddFacilities";
import TopBar from "@/components/ui/TopBar";
import { ROUTES } from "@/data/routes";

const message =
  "Copy the new facility rows from the sheet and paste them into the top left cell.";

const AddFacilitiesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <TopBar
        title="Add Facilities"
        showIconButton
        onIconClick={() => navigate(ROUTES.ADMIN_FACILITIES)}
      />
      <span className="block mt-3 mb-1 text-sm text-gray-500">{message}</span>
      <AddFacilities />
    </div>
  );
};

export default AddFacilitiesPage;
