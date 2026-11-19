import { Eyebrow } from "./Eyebrow";
import { Reveal } from "./Reveal";
import { securityItems } from "../data/security";

export const SecuritySection = () => (
  <section
    id="security"
    className="landing-anchor relative overflow-hidden py-16 lg:py-24"
    style={{
      background:
        "linear-gradient(180deg, var(--green-50) 0%, #ffffff 55%, var(--green-50) 100%)",
    }}
  >
    <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-[var(--green-100)]/50 blur-3xl pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
      <Reveal variant="left">
        <Eyebrow>Security &amp; Compliance</Eyebrow>
        <h2 className="mt-3 text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-green-custom)]">
          Patient trust,
          <span className="text-[var(--color-text-custom)]">
            {" "}
            built into every layer.
          </span>
        </h2>
        <p className="mt-4 text-gray-600 leading-relaxed max-w-lg">
          Health data is sensitive by nature. EMR Sindh is engineered so that
          every record is protected, every action is accountable, and every
          byte stays within provincial control.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-green-custom)] bg-white border border-[var(--green-200)] px-4 py-2 rounded-full shadow-[var(--shadow-green-sm)]">
          An initiative of the Government of Sindh — Health Department
        </div>
      </Reveal>

      <div className="grid sm:grid-cols-2 gap-5">
        {securityItems.map((s, i) => (
          <Reveal key={s.title} variant="right" delay={(i % 2) * 100}>
            <div className="group relative h-full rounded-2xl bg-white p-7 border border-gray-100 hover:border-[var(--color-green-custom)]/40 hover:shadow-[var(--shadow-green-md)] hover:-translate-y-1 transition-all duration-300">
              {/* subtle corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[2rem] bg-gradient-to-br from-[var(--green-50)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div
                style={{ marginBottom: "1.5rem" }}
                className="relative flex w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--green-100)] to-[var(--green-200)] text-[var(--color-green-custom)] items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform"
              >
                {s.icon}
              </div>
              <h3 className="relative text-base font-semibold text-[var(--color-text-custom)]">
                {s.title}
              </h3>
              <p
                style={{ marginTop: "0.625rem" }}
                className="relative text-sm text-gray-600 leading-relaxed"
              >
                {s.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
