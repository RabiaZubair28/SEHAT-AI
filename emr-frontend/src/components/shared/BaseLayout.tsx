import React, { useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  BellOutlined, UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Empty,
  Layout,
  Menu,
  theme,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { User } from "@/config/sidebarConfig";
import { getActiveKey } from "@/utils/sidebarUtils";
import { matchPath } from "react-router-dom"; // Add at the top if not
import { ROUTES } from "@/data/routes";
import sindhLogo from "@/assets/layout/small_logo.png";
import { formatRoleName } from "@/utils/formats/rolesFormatter";
import sindhLogoFull from "@/assets/layout/sindh_logo.svg";
import bgGreen from "@/assets/layout/bg-green.png";
import { Roles } from "@/data/types";
import {
  setAdminCredentials,
  setServices,
} from "@/redux/store/slices/authAdminSlice";
import { setUserCredentials } from "@/redux/store/slices/authUserSlice";
import {
  addNotification,
  markNotificationAsRead,
  removeNotification,
} from "@/redux/store/slices/appNotificationsSlice";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { socketService } from "@/services/socketServices";
import AttendanceToggle from "@/features/attendance/components/AttendanceToggle";
import { mapTelehealthRequestAcceptedToNotification } from "@/utils/helpers/appNotificationMappers";
import { useGlobalNotification } from "@/hooks/useNotification";
import {useUserDropdownItems} from "@/hooks/userDropDownItem";
import {GRADIENT_SOFT} from "@/features/admin/reports/components/shared/constants";
import Loader from "@/components/shared/Loader";

const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed";

const { Header, Sider, Content } = Layout;

// Define the AppLayoutProps interface
interface AppLayoutProps {
  children: React.ReactNode;
  userData: User | null;
  sideBarItems: any[];
}

const BaseLayout: React.FC<AppLayoutProps> = ({
  children,
  userData,
  sideBarItems,
}) => {
  const { dropdownItems, isLogoutLoading } = useUserDropdownItems()
  const dispatch = useDispatch();
  const showNotification = useGlobalNotification();
  // const sideBarItems = useSidebarItems(userData);
  const notifications = useSelector(
    (state: RootState) => state.appNotifications.items,
  );

  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  const facilityName = userData?.facility?.name || "Super Admin";
  const district = userData?.facility?.district?.name || "Sindh";
  const userName =
    `${userData?.first_name ?? ""} ${userData?.last_name ?? ""}`.trim() ||
    "Placeholder Name";
  const userRole = formatRoleName(userData?.role?.name as Roles);
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateUserCallBack = (userUpdated: any) => {
    if (
      userUpdated?.user.role.name === Roles.ADMIN ||
      userUpdated?.user.role.name === Roles.SUPER_ADMIN ||
      userUpdated?.user.role.name === Roles.FACILITY_INCHARGE ||
      userUpdated?.user.role.name === Roles.HEAD_OFFICE
    ) {
      dispatch(setAdminCredentials(userUpdated.user));
      dispatch(setServices(userUpdated.services));
    } else {
      dispatch(setUserCredentials(userUpdated.user));
    }
  };

  const handleTelehealthRequestAccepted = (payload: any) => {
    dispatch(
      addNotification(mapTelehealthRequestAcceptedToNotification(payload)),
    );
    showNotification(
      "success",
      "Telehealth Request Accepted",
      `${
        payload?.consultantDoctorName || "Consultant"
      } accepted the telehealth request for ${
        payload?.patientName || "the selected patient"
      }.`,
      0,
    );
  };

  const handleJoinCall = (notificationId: string, meetingUrl?: string) => {
    dispatch(markNotificationAsRead(notificationId));

    if (meetingUrl) {
      window.open(meetingUrl, "_blank", "noopener,noreferrer");
    }
  };

  const notificationsOverlay = (
    <div className="w-[360px] overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <p className="mb-0 text-sm font-semibold text-slate-900">
            Notifications
          </p>
          <p className="mb-0 text-xs text-slate-500">{unreadCount} unread</p>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border-b border-gray-100 px-4 py-3 ${
                notification.read ? "bg-white" : "bg-emerald-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm font-semibold text-slate-900">
                    {notification.title}
                  </p>
                  <p className="mb-2 text-xs text-slate-600">
                    {notification.message}
                  </p>
                  <p className="mb-0 text-[11px] text-slate-400">
                    {new Date(notification.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Button
                  type="text"
                  size="small"
                  onClick={() => dispatch(removeNotification(notification.id))}
                >
                  <CloseOutlined />
                </Button>
              </div>

              {notification.meetingUrl ? (
                <div className="mt-3 flex justify-end">
                  <Button
                    type="primary"
                    size="small"
                    onClick={() =>
                      handleJoinCall(notification.id, notification.meetingUrl)
                    }
                  >
                    Join Call
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="px-4 py-8">
            <Empty
              description="No notifications"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    const token = (userData as any)?.access_token;
    // console.log(userData, "User Data in BaseLayout");
    if (!token) {
      // console.log("No token available, skipping socket connection");
      return;
    }

    socketService.connect(token);
    socketService.on("user_updated", updateUserCallBack);
    socketService.on(
      "telehealth_request_accepted",
      handleTelehealthRequestAccepted,
    );

    return () => {
      socketService.off("user_updated", updateUserCallBack); // Disconnect when app unmounts
      socketService.off(
        "telehealth_request_accepted",
        handleTelehealthRequestAccepted,
      );
    };
  }, []); // Add userData as dependency

  return (
    <>
      {isLogoutLoading && <Loader />}
      <Layout
        className="flex flex-col h-screen overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
      {(!isMobile || !collapsed) && (
        <Sider
          trigger={null}
          collapsible
          collapsed={isMobile ? false : collapsed}
          className="bg-white"
          width={isMobile ? "60%" : 250}
          style={{
            borderRight: "1px solid #e8e8e8",
            boxShadow: "2px 0 8px rgba(0,0,0,0.08)",
            background: "white",
            position: isMobile ? "absolute" : "relative",
            zIndex: 1000,
            height: "100vh",
            display: isMobile && collapsed ? "none" : "block",
            overflow: "hidden",
          }}
        >
          {/* Logo Section - Fixed */}
          <div className="flex justify-center items-center px-2 py-3 md:mb-4 mb-10">
            {collapsed ? (
              <div className="relative w-100 h-12 ">
                <img
                  src={sindhLogo}
                  alt="Sindh Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="relative w-100 h-14">
                <img
                  src={sindhLogoFull}
                  alt="Sindh Logo"
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {isMobile && (
            <div className="absolute right-0 top-0">
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => setCollapsed(true)}
                style={{ fontSize: "14px" }}
              />
            </div>
          )}

          {/* Scrollable Menu Section */}
          <div
            style={{
              height: !collapsed
                ? "calc(100vh - 420px)"
                : "calc(100vh - 200px)",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <Menu
              theme="light"
              mode="inline"
              selectedKeys={[getActiveKey(location.pathname, sideBarItems)]}
              className="custom-menu border-none mt-2"
              items={sideBarItems}
              onClick={({ key }) => {
                navigate(key);
                if (isMobile) setCollapsed(true);
              }}
            />

            {/* Back to Queue Button - Inside scroll area */}
            {matchPath("/patient/:patientId/*", location.pathname) && (
              <div
                style={{
                  padding: "12px 24px 0 24px",
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Button
                  type="text"
                  icon={
                    <ArrowLeftOutlined
                      style={{ color: "var(--color-green-custom)" }}
                    />
                  }
                  onClick={() => navigate(ROUTES.PATIENT_QUEUE)}
                  style={{
                    textAlign: "left",
                    height: 40,
                    paddingLeft: 0,
                    color: "var(--color-green-custom)",
                  }}
                >
                  {!collapsed && "Back to Queue"}
                </Button>
              </div>
            )}
          </div>

          {/* Powered By Section - Fixed at Bottom */}
          {!collapsed && (
            <div
              className="p-6"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "white",
              }}
            >
              <div
                className="bg-cover bg-center text-white py-12 rounded-lg text-center"
                style={{ backgroundImage: `url(${bgGreen})` }}
              >
                <p className="font-medium text-lg !mb-0">Powered by</p>
                <p className="text-sm !mb-0">Health Department,</p>
                <p className="text-sm">Government of Sindh</p>
              </div>
            </div>
          )}
        </Sider>
      )}
      <Layout>
        <Header
          style={{
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            background: "white",
            padding: "0 20px",
          }}
          className="flex justify-between items-center"
        >
          {/* Left side: menu button + facility info */}
          <div className="flex items-center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="!text-green-custom !text-xl"
            />
            <div className="ml-4">
              <p className="text-sm md:text-lg !mb-0 font-semibold text-green-custom">
                {facilityName}
              </p>
              <p className="text-xs md:text-sm !mb-0 text-gray-500">
                {district}
              </p>
            </div>
          </div>

          {/* Right side: user info */}
          <div className="flex items-center gap-2 space-x-3">
            {userData?.role?.name !== Roles.SUPER_ADMIN &&
              userData?.role?.name !== Roles.FACILITY_INCHARGE &&
              userData?.role?.name !== Roles.ADMIN &&
              userData?.role?.name !== Roles.HEAD_OFFICE && (
                <AttendanceToggle type="primary" iconOnly={isMobile} />
              )}
            <Dropdown
              trigger={["click"]}
              placement="bottomRight"
              overlayStyle={{ paddingTop: 12 }}
              popupRender={() => notificationsOverlay}
            >
              <Button type="text" className="!px-2">
                <Badge count={unreadCount} size="small">
                  <BellOutlined className="text-lg text-slate-700" />
                </Badge>
              </Button>
            </Dropdown>
            <Avatar
                src={userData?.role?.avatar}
                icon={<UserOutlined />}
                style={{ background: GRADIENT_SOFT, height: "48px", width: "50px" }}
            />
            <Dropdown trigger={["click"]} menu={{ items: dropdownItems }}>
              <a onClick={(e) => e.preventDefault()}>
                <div className="text-left leading-tight">
                  <div className="flex items-center space-x-1 text-black">
                    <span className="text-xs md:text-sm">{userName}</span>
                    <DownOutlined
                      style={{
                        color: "#000",
                        fontSize: "10px",
                        marginTop: "4px",
                      }}
                    />
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    {userRole}
                  </div>
                </div>
              </a>
            </Dropdown>
            {/* <span className="text-sm">User Name</span> */}
          </div>
        </Header>

        <Content
          className="md:m-6 p-6 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-green-custom"
          style={{
            minHeight: 280,
            background: "var(--content-bg, white)",
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
      </Layout>
    </>
  );
};

export default BaseLayout;
