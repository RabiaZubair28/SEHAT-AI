import { Button } from "antd";
import {
  ArrowRightOutlined,
  LoginOutlined,
  HeartOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Reveal } from "./Reveal";

const orbitIcons = [
  { icon: <TeamOutlined />, className: "top-2 left-8" },
  { icon: <MedicineBoxOutlined />, className: "top-8 right-2" },
  { icon: <SafetyCertificateOutlined />, className: "bottom-6 right-8" },
  { icon: <DatabaseOutlined />, className: "bottom-2 left-2" },
];

export const AboutSection = ({ onLogin }: { onLogin: () => void }) => (
  <section id="about" className="landing-anchor py-16 lg:py-24 bg-white">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal variant="scale" className="relative rounded-3xl overflow-hidden shadow-2xl">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-green-custom) 0%, #0a5d34 55%, #0e7a45 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 25%, rgba(255,255,255,0.35) 1px, transparent 1px), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "28px 28px, 44px 44px",
          }}
        />
        <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative px-8 lg:px-14 py-14 lg:py-20 grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white bg-white/20 border border-white/30 px-3 py-1.5 rounded-full">
              Built by the Health Department
            </span>
            <h2
              style={{ marginTop: "1.5rem" }}
              className="text-3xl lg:text-[2.75rem] font-bold tracking-tight text-white leading-[1.1]"
            >
              Built for the people of Sindh.
            </h2>
            <p className="mt-4 text-base lg:text-lg text-white/80 max-w-xl leading-relaxed">
              EMR Sindh digitizes care delivery across primary and secondary
              facilities — bringing transparency, continuity, and better
              outcomes to every patient encounter.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="large"
                onClick={onLogin}
                icon={<LoginOutlined />}
                style={{
                  background: "#ffffff",
                  borderColor: "#ffffff",
                  color: "var(--color-green-custom)",
                  fontWeight: 600,
                  height: 52,
                  paddingInline: 28,
                  fontSize: 15,
                }}
              >
                Login to EMR
              </Button>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all"
              >
                Talk to the team <ArrowRightOutlined />
              </a>
            </div>
          </div>

          {/* Network visual — replaces the empty button column */}
          <div className="hidden lg:flex flex-col items-center gap-6">
            <div className="relative flex items-center justify-center h-52 w-52">
              {orbitIcons.map((o, i) => (
                <span
                  key={i}
                  className={`absolute ${o.className} w-11 h-11 rounded-xl bg-white shadow-lg text-[var(--color-green-custom)] flex items-center justify-center text-lg`}
                >
                  {o.icon}
                </span>
              ))}
              <div className="relative w-32 h-32 rounded-full bg-white shadow-2xl flex flex-col items-center justify-center text-center border-4 border-white/40">
                <HeartOutlined className="text-2xl text-[var(--color-green-custom)]" />
                <span className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-green-custom)] leading-tight px-3">
                  Patient at
                  <br />
                  the center
                </span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/80 bg-white/10 px-3 py-1 rounded-full">
              <EnvironmentOutlined /> 150+ facilities across Sindh
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);
