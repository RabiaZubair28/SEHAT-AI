import React from "react";
import { Result } from "antd";
import CustomButton from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={
        <div className="space-x-4">
          <CustomButton title="Go Back" variant="primary" onClick={goBack} />
        </div>
      }
    />
  );
};

export default NotFoundPage;
