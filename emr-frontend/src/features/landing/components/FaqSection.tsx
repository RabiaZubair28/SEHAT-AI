import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Eyebrow } from "./Eyebrow";
import { SectionTitle } from "./SectionTitle";
import { Reveal } from "./Reveal";
import { faqs } from "../data/faq";

export const FaqSection = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="landing-anchor py-16 lg:py-24 bg-[#fafbfa]">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <Reveal className="text-center">
          <Eyebrow>FAQ</Eyebrow>
          <SectionTitle lead="Questions," trail="answered." />
          <p className="mt-4 text-gray-600">
            The essentials about how EMR Sindh works and keeps patient data safe.
          </p>
        </Reveal>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.question} delay={i * 60}>
                <div
                  className={`rounded-2xl border transition-colors ${
                    isOpen
                      ? "border-[var(--color-green-custom)]/40 bg-white shadow-sm"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 cursor-pointer bg-transparent border-0"
                  >
                    <span className="text-base font-semibold text-[var(--color-text-custom)]">
                      {f.question}
                    </span>
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs transition-transform duration-300 ${
                        isOpen
                          ? "bg-[var(--color-green-custom)] text-white rotate-45"
                          : "bg-[var(--color-green-custom)]/10 text-[var(--color-green-custom)]"
                      }`}
                    >
                      <PlusOutlined />
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                        {f.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
