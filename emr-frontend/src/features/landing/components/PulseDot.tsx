export const PulseDot = ({ color = "bg-white" }: { color?: string }) => (
  <span className="relative flex h-2 w-2 shrink-0">
    <span
      className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${color}`}
    />
    <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
  </span>
);
