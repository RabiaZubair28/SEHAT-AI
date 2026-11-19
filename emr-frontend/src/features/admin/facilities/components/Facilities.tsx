import React, { useState } from "react";
import { Alert, Button, Form, Modal, Table } from "antd";
import {
  advanceSearchData,
  facilityFormFields,
} from "@/features/admin/data/faciltiesConstants";
import FormModal from "@/components/ui/FormModal";
import { useGlobalNotification } from "@/hooks/useNotification";
import {
  FacilityParams,
  useGetFacilitiesQuery,
} from "../../services/facilitiesApi";
import CustomCollapse from "@/components/shared/AdvanceSearch";
import { usePermissionCheck } from "@/hooks/usePermission";
import { ROUTE_KEYS } from "@/data/routeKey";
import Loader from "@/components/shared/Loader";
import { Link } from "react-router-dom";
import { ROUTES } from "@/data/routes";

const FacilitiesTable: React.FC = () => {
  const showNotification = useGlobalNotification();
  const hasSearchAccess = usePermissionCheck(
    ROUTE_KEYS.GET_A_SPECIFIC_FACILITY_BY_ID,
  );
  const canBulkAdd = usePermissionCheck(ROUTE_KEYS.BULK_CREATE_FACILITIES);
  const [searchForm] = Form.useForm();
  const [queryParams, setQueryParams] = useState<FacilityParams>({
    page: 1,
    limit: 10,
    name: undefined,
    code: undefined,
  });

  const {
    data: facilitiesResponse,
    isLoading,
    isError,
    isFetching: isFetchingFacilities,
    error,
    // refetch,
  } = useGetFacilitiesQuery(queryParams);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTableChange = (page: number, pageSize?: number) => {
    setQueryParams({
      ...queryParams,
      page,
      limit: pageSize || queryParams.limit,
    });
  };

  const handleSearch = (values: any) => {
    setQueryParams({
      ...queryParams,
      page: 1,
      name: values.name,
      code: values.code,
    });
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQueryParams({
      page: 1,
      limit: 10,
      name: undefined,
      code: undefined,
    });
  };

  if (isLoading || isFetchingFacilities) {
    return <Loader />;
  }

  if (isError) {
    const apiError = error as {
      status: number;
      data?: { error?: string; message?: string };
    };

    const errorTitle = apiError?.data?.error || "Error";
    const errorDescription = apiError?.data?.message || "Something went wrong.";

    showNotification("error", `${errorTitle}: ${errorDescription}`);

    return <Alert message="Failed to load facilities" type="error" showIcon />;
  }

  const columns = [
    {
      title: "S.No",
      key: "index",
      render: (_: any, __: any, index: number) =>
        ((queryParams.page || 1) - 1) * (queryParams.limit || 10) + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Facility Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Managed By",
      dataIndex: "managed_by",
      key: "managed_by",
    },
    {
      title: "Facility Type",
      dataIndex: "facility_type",
      key: "facility_type",
    },
  ];

  return (
    <div className="user-management">
      {hasSearchAccess && (
        <CustomCollapse
          fieldConfig={advanceSearchData}
          handleReset={handleReset}
          handleSearch={handleSearch}
          searchForm={searchForm}
        />
      )}

      {canBulkAdd && (
        <div className="flex justify-end my-4 ">
          <Button type="primary">
            <Link to={ROUTES.ADMIN_FACILITIES_ADD}>Add Facilities</Link>
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={facilitiesResponse?.data || []}
        size="small"
        rowKey="id"
        scroll={{ x: "max-content" }}
        pagination={{
          current: queryParams.page,
          pageSize: queryParams.limit,
          total: facilitiesResponse?.count || 0,
          onChange: handleTableChange,
          showSizeChanger: false,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Modal title="Confirm Deletion" okText="Delete" cancelText="Cancel">
        <p>Are you sure you want to delete this modal?</p>
      </Modal>

      <FormModal
        open={isModalOpen}
        title="Add New Facility"
        onCancel={() => setIsModalOpen(false)}
        onFinish={() => console.log("submitted")}
        fields={facilityFormFields as any}
      />
    </div>
  );
};

export default FacilitiesTable;
