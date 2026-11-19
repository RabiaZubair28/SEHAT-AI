import { Layout } from "antd";
import logo from "@/assets/layout/sindh_logo.svg";
import footer from "@/assets/layout/Powered by Sindh Gov.png";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";

const { Content, Footer, Header } = Layout;

const AuthLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F4F7]">
      {/* Header */}
      <Header
        style={{ background: "#F3F4F7" }}
        className="py-30 my-5 px-4 w-full flex flex-col items-center"
      >
        <img src={logo} alt="Header Logo" className="max-h-[75px] cursor-pointer" onClick={() => navigate(ROUTES.LOGIN)} />
      </Header>

      {/* Content */}
      <Content className="flex-1 flex justify-center items-start w-full px-4 mb-12">
        <div className="w-full max-w-[550px] mt-5 bg-white rounded-lg shadow-md p-4">
          {children}
        </div>
      </Content>

      {/* Footer */}
      <Footer
        className="w-full text-center py-12"
        style={{ background: "var(--color-green-custom)" }} // Inline style to use the CSS variable
      >
        <img src={footer} alt="Footer Logo" className="h-[50px] mx-auto" />
      </Footer>
    </div>
  );
};

export default AuthLayout;
