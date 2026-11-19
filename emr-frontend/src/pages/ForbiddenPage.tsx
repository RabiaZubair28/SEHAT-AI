import CustomButton from "@/components/ui/Button";
import { Result } from "antd";
import { useNavigate } from "react-router-dom";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you don’t have permission to visit this page."
      extra={
        <div className="space-x-4">
          <CustomButton title="Go Back" variant="primary" onClick={goBack} />
        </div>
      }
    />
  );
}
