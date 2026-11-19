export const SectionTitle = ({ lead, trail }: { lead: string; trail: string }) => (
  <h2 className="mt-3 text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-green-custom)]">
    {lead}
    <span className="text-[var(--color-text-custom)]"> {trail}</span>
  </h2>
);
