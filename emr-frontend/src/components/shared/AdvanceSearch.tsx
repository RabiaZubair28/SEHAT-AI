import { Collapse, Form, Row, Col, Input, Button, Space, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import React from "react";

export interface FieldOption {
  label: string;
  value: any;
}

export interface FieldConfig {
  type: "input" | "select";
  label: string;
  name: string;
  placeholder?: string;
  options?: FieldOption[];
}

interface CustomCollapseProps {
  fieldConfig: FieldConfig[];
  handleSearch: (values: any) => void;
  handleReset: () => void;
  searchForm: any;
}

const CustomCollapse: React.FC<CustomCollapseProps> = ({
  fieldConfig,
  handleSearch,
  handleReset,
  searchForm,
}) => {
  const formContent = (
    <Form form={searchForm} layout="vertical" onFinish={handleSearch}>
      <Row gutter={24}>
        {fieldConfig.map((field, index) => (
          <Col span={12} key={index}>
            {field.type === "input" && (
              <Form.Item label={field.label} name={field.name}>
                <Input placeholder={field.placeholder} allowClear />
              </Form.Item>
            )}
            {field.type === "select" && (
              <Form.Item label={field.label} name={field.name}>
                <Select
                  allowClear
                  placeholder={field.placeholder}
                  options={field.options}
                />
              </Form.Item>
            )}
          </Col>
        ))}

        <Col span={24}>
          <Space>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Search
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );

  return (
    <Collapse
      className="!mb-8"
      items={[
        {
          key: "1",
          label: "Advanced Search",
          children: formContent,
        },
      ]}
    />
  );
};

export default CustomCollapse;
