import { MailOutlined, EnvironmentOutlined } from "@ant-design/icons";
import poweredBy from "@/assets/layout/Powered by Sindh Gov.png";
import { footerLinks } from "../data/navLinks";

export const Footer = ({ onLogin }: { onLogin: () => void }) => (
  <footer
    id="contact"
    className="landing-anchor text-white/80 pt-16 pb-8 px-6 lg:px-10"
    style={{ background: "var(--color-green-custom)" }}
  >
    <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10">
      <div className="md:col-span-5">
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <div className="text-white font-bold text-base">EMR Sindh</div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/70">
              Government of Sindh
            </div>
          </div>
        </div>
        <p className="mt-5 text-sm text-white/70 max-w-sm leading-relaxed">
          An initiative of the Government of Sindh — Health Department to
          modernize and unify clinical record-keeping across the province.
        </p>
      </div>

      <div className="md:col-span-3 text-sm">
        <h4 className="text-white font-semibold mb-4 text-[13px] uppercase tracking-wider">
          Product
        </h4>
        <ul className="space-y-2.5 text-white/70">
          {footerLinks.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-white transition">
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <button
              onClick={onLogin}
              className="hover:text-white bg-transparent border-0 cursor-pointer p-0 text-left"
            >
              Login
            </button>
          </li>
        </ul>
      </div>

      <div className="md:col-span-4 text-sm">
        <h4 className="text-white font-semibold mb-4 text-[13px] uppercase tracking-wider">
          Contact
        </h4>
        <ul className="space-y-3 text-white/75">
          <li className="flex items-start gap-2.5">
            <EnvironmentOutlined className="mt-0.5 text-white/60" />
            <span>
              Health Department, Government of Sindh
              <br />
              Karachi, Pakistan
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <MailOutlined className="text-white/60" />
            <span>health.support@sindh.gov.pk</span>
          </li>
        </ul>
      </div>
    </div>

    <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-xs text-white/60">
        © {new Date().getFullYear()} EMR Sindh. All rights reserved.
      </p>
      <img src={poweredBy} alt="Powered by Sindh Government" className="h-8" />
    </div>
  </footer>
);
