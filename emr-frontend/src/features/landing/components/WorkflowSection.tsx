import { Eyebrow } from "./Eyebrow";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";
import { workflow } from "../data/workflow";

export const WorkflowSection = () => (
  <section id="workflow" className="landing-anchor py-16 lg:py-24">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal className="max-w-2xl">
        <Eyebrow>How it works</Eyebrow>
        <SectionTitle lead="A patient's journey," trail="captured end to end." />
        <p className="mt-4 text-gray-600">
          EMR Sindh follows the patient — from registration at the front desk
          to dispensing at the pharmacy — without breaking context.
        </p>
      </Reveal>

      <div className="mt-14 relative">
        <div
          className="hidden lg:block absolute left-0 right-0 top-7 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(6,69,38,0.25) 12%, rgba(6,69,38,0.25) 88%, transparent)",
          }}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
          {workflow.map((w, i) => (
            <Reveal key={w.step} delay={(i % 4) * 90} className="relative">
              <div className="relative z-10 inline-flex w-14 h-14 rounded-2xl bg-white border-2 border-[var(--color-green-custom)] text-[var(--color-green-custom)] items-center justify-center text-xl shadow-md">
                {w.icon}
              </div>
              <div className="mt-5 text-[11px] uppercase tracking-[0.18em] text-[var(--color-green-custom)] font-semibold">
                Step {w.step}
              </div>
              <h3 className="mt-1 text-lg font-bold text-[var(--color-text-custom)]">
                {w.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {w.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);
