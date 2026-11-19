import React from "react";
import { Typography, Avatar, Row, Col, Grid } from "antd";

const { Text } = Typography;

interface PersonCardProps {
  imageSrc: string;
  name: string;
  mrNumber: string;
  age: string;
}

const PersonInfoCard: React.FC<PersonCardProps> = ({
  imageSrc,
  name,
  mrNumber,
  age,
}) => {
  const screens = Grid.useBreakpoint();
  return (
    <div
      style={{
        maxWidth: 400,
        borderRadius: 12,
        borderStyle: "none",
        padding: screens.md ? "8px 16px" : "4px 8px",
      }}
    >
      <Row align="middle" gutter={16}>
        <Col>
          <Avatar
            src={imageSrc}
            size={screens.md ? 70 : 45} 
            style={{ border: "1px solid #f0f0f0" }}
          />
        </Col>
        <Col flex="auto">
          <Text className="!text-green-custom" strong>
            {name}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            MR # {mrNumber}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {age}
          </Text>
        </Col>
      </Row>
    </div>
  );
};

export default PersonInfoCard;
