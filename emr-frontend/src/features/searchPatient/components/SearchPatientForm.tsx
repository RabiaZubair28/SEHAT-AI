import TopBar from "@/components/ui/TopBar";
import PatientSearchForm from "@/features/searchPatient";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";

function SearchPatient() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar
        title="Search By"
        extraActions={
          <Button
            type="primary"
            danger
            style={{ fontWeight: "500" }}
            className="!text-xs !px-2 !py-0 sm:!text-sm sm:!px-4"
            onClick={() => navigate(`/${ROUTES.EMERGENCY}`)}
          >
            Emergency
          </Button>
        }
      />
      <br />
      <PatientSearchForm />
    </>
  );
}

export default SearchPatient;
