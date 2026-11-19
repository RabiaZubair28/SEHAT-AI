export const navLinks = [
  { href: "#features", label: "Modules" },
  { href: "#workflow", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export const footerLinks = navLinks.filter((l) => l.href !== "#contact");
