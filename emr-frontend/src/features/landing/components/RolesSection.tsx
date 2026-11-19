import { Eyebrow } from "./Eyebrow";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";
import { roles } from "../data/roles";

export const RolesSection = () => (
  <section id="roles" className="landing-anchor py-16 lg:py-24 bg-[#fafbfa]">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal className="max-w-2xl">
        <Eyebrow>Built for every role</Eyebrow>
        <SectionTitle lead="One platform," trail="every member of the care team." />
        <p className="mt-4 text-gray-600">
          From the front desk to district leadership, each role gets a focused,
          guided experience — nothing more, nothing less than they need.
        </p>
      </Reveal>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((r, i) => (
          <Reveal key={r.title} delay={(i % 3) * 80}>
            <div className="group h-full flex items-start gap-4 rounded-2xl bg-white p-6 border border-gray-100 hover:border-[var(--color-green-custom)]/40 hover:shadow-[var(--shadow-green-sm)] transition-all duration-300">
              <span className="shrink-0 w-11 h-11 rounded-xl bg-[var(--color-green-custom)]/10 text-[var(--color-green-custom)] flex items-center justify-center text-lg group-hover:bg-[var(--color-green-custom)] group-hover:text-white transition-colors">
                {r.icon}
              </span>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-custom)]">
                  {r.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {r.description}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
