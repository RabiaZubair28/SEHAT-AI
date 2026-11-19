import { ArrowRightOutlined } from "@ant-design/icons";
import { Eyebrow } from "./Eyebrow";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";
import { features } from "../data/features";

export const FeaturesSection = () => (
  <section id="features" className="landing-anchor py-16 lg:py-24 bg-[#fafbfa]">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow>Modules</Eyebrow>
            <SectionTitle
              lead="Everything a public-health facility needs,"
              trail="in one place."
            />
            <p className="mt-4 text-gray-600">
              From the moment a patient walks in to the dispensing of their
              prescription — every step is captured, audited, and reportable.
            </p>
          </div>
          <a
            href="#workflow"
            className="text-[var(--color-green-custom)] font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all"
          >
            See the patient journey <ArrowRightOutlined />
          </a>
        </div>
      </Reveal>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 4) * 70}>
            <div className="group relative h-full bg-white rounded-2xl p-6 border border-gray-100 hover:border-[var(--color-green-custom)]/40 hover:shadow-[var(--shadow-green-md)] hover:-translate-y-1 transition-all duration-300">
              <div
                className={`mb-6 w-12 h-12 rounded-xl bg-gradient-to-br ${f.tint} text-[var(--color-green-custom)] flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform`}
              >
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-custom)]">
                {f.title}
              </h3>
              <p className="mt-2.5 text-sm text-gray-600 leading-relaxed">
                {f.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
