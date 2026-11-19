import { Button, Form, Row, Col, Tabs } from "antd";
import TopBar from "@/components/ui/TopBar.tsx";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes.ts";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/index.tsx";
import { useDropDownPagination } from "@/hooks/useDropDownPagination.tsx";
import { useMemo, useState } from "react";
import { Roles } from "@/data/types.tsx";
import SingleSelectDropDown from "@/components/ui/SingleSelect.tsx";
import { FilterOutlined } from "@ant-design/icons";
import MedicineCommoditiesTable from "./components/MedicineCommoditiesTable";
import {
  useGetCommodityRequestsByRequesterQuery,
  useGetCommodityRequestsQuery,
} from "../services/medicinecommoditiyApi";
import Loader from "@/components/shared/Loader";
import { STATUS_OPTIONS } from "@/data/constants";
import { filterByContraceptiveType } from "../constants/helpers";

export default function CommodityRequests() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<string>("1");
  const [form] = Form.useForm();
  const pagination = useDropDownPagination();
  const user = useSelector(
    (state: RootState) => state.authUser.user ?? state.authAdmin.admin,
  );
  const isApprover =
    user?.role?.name === Roles.DISPENSER ||
    user?.role?.name === Roles.FACILITY_INCHARGE;
  const listRoute =
    user?.role?.name === Roles.FACILITY_INCHARGE
      ? ROUTES.ADMIN_COMMODITY_REQUESTS
      : ROUTES.COMMODITY_REQUESTS;
  const [searchParams, setSearchParams] = useState<{
    status?: string;
    medicine?: number;
  }>({});

  const {
    data: commoditiesRequestByUserId,
    isLoading: commoditiesRequestByUserIdLoading,
    isFetching: commoditiesRequestByUserIdFetching,
  } = useGetCommodityRequestsByRequesterQuery(Number(user?.id), {
    skip: !!isApprover,
  });

  const {
    data: allCommoditiesRequests,
    isLoading: allCommoditiesRequestsLoading,
  } = useGetCommodityRequestsQuery(
    { status: searchParams?.status },
    { skip: !isApprover }, // skips if NOT a dispenser
  );

  const handleSearch = () => {
    const values = form.getFieldsValue();
    setSearchParams(values);
  };

  const handleReset = () => {
    form.resetFields();

    pagination.reset();
    setSearchParams({});
  };

  const commoditiesData = useMemo(() => {
    return isApprover ? allCommoditiesRequests : commoditiesRequestByUserId;
  }, [commoditiesRequestByUserId, user, allCommoditiesRequests]);

  const handleTabChange = (key: string) => {
    setActiveKey(key); // change the tab
    form.resetFields(); // reset form fields
    setSearchParams({}); // reset search params
  };

  if (
    commoditiesRequestByUserIdLoading ||
    allCommoditiesRequestsLoading ||
    commoditiesRequestByUserIdFetching
  )
    return <Loader />;

  return (
    <>
      <TopBar title="Medicine Commodities" />

      {/* Request button */}
      {!isApprover && (
        <div className="flex justify-end mt-6 mb-6">
          <Button
            type="primary"
            onClick={() => navigate(ROUTES.NEW_COMMODITY_REQUESTS)}
          >
            Request new commodity
          </Button>
        </div>
      )}
      <Form form={form} layout="vertical">
        <Row gutter={16} className="mt-6">
          <Col xs={24} sm={12} md={12} lg={16}>
            <Form.Item name="status" label="Filter by status">
              <SingleSelectDropDown
                placeholder="Select status"
                showSearch
                onChange={(value) => form.setFieldsValue({ status: value })}
                filterOption={false}
                options={STATUS_OPTIONS}
              />
            </Form.Item>
          </Col>

          {/* Search Button */}
          <Col xs={24} sm={12} md={12} lg={3}>
            <Form.Item label=" ">
              <Button
                icon={<FilterOutlined />}
                type="primary"
                block
                onClick={handleSearch}
              >
                Search
              </Button>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={12} lg={3}>
            <Form.Item label=" ">
              <Button block onClick={handleReset}>
                Reset
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Tabs
        defaultActiveKey="1"
        activeKey={activeKey}
        onChange={handleTabChange}
        // destroyOnHidden={!editMode}
        items={[
          {
            key: "1",
            label: "Medicine generated commodities",
            children: (
              <MedicineCommoditiesTable
                searchParams={searchParams}
                commodities={filterByContraceptiveType(
                  commoditiesData || [],
                  false,
                )}
                listRoute={listRoute}
              />
            ),
          },
          {
            key: "2",
            label: "Contraceptive generated commodities",
            children: (
              <MedicineCommoditiesTable
                searchParams={searchParams}
                commodities={filterByContraceptiveType(
                  commoditiesData || [],
                  true,
                )}
                listRoute={listRoute}
              />
            ),
          },
        ]}
      />
    </>
  );
}
