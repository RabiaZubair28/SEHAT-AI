import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import logo from "@/assets/layout/sindh_logo.svg";
import { navLinks } from "../data/navLinks";

export const Navbar = ({ onLogin }: { onLogin: () => void }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 lg:h-24 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center cursor-pointer bg-transparent border-0 p-0"
          aria-label="EMR Sindh — Home"
        >
          <img src={logo} alt="EMR Sindh" className="h-14 lg:h-16" />
        </button>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hover:text-[var(--color-green-custom)] transition"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <Button
          type="primary"
          size="large"
          icon={<LoginOutlined />}
          onClick={onLogin}
          style={{
            background: "var(--color-green-custom)",
            borderColor: "var(--color-green-custom)",
            fontWeight: 500,
            boxShadow: "0 6px 18px -8px rgba(6,69,38,0.6)",
          }}
        >
          Login
        </Button>
      </div>
    </header>
  );
};
