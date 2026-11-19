import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/data/routes";
import { AnnouncementStrip } from "@/features/landing/components/AnnouncementStrip";
import { Navbar } from "@/features/landing/components/Navbar";
import { Hero } from "@/features/landing/components/Hero";
import { TrustStrip } from "@/features/landing/components/TrustStrip";
import { FeaturesSection } from "@/features/landing/components/FeaturesSection";
import { WorkflowSection } from "@/features/landing/components/WorkflowSection";
import { RolesSection } from "@/features/landing/components/RolesSection";
import { CoverageSection } from "@/features/landing/components/CoverageSection";
import { SecuritySection } from "@/features/landing/components/SecuritySection";
import { FaqSection } from "@/features/landing/components/FaqSection";
import { AboutSection } from "@/features/landing/components/AboutSection";
import { Footer } from "@/features/landing/components/Footer";

const Landing = () => {
  const navigate = useNavigate();
  const goToLogin = () => navigate(ROUTES.LOGIN);

  return (
    <div className="min-h-screen bg-white text-[var(--color-text-custom)]">
      <AnnouncementStrip />
      <Navbar onLogin={goToLogin} />
      <Hero onLogin={goToLogin} />
      <TrustStrip />
      <FeaturesSection />
      <WorkflowSection />
      <RolesSection />
      <CoverageSection />
      <SecuritySection />
      <FaqSection />
      <AboutSection onLogin={goToLogin} />
      <Footer onLogin={goToLogin} />
    </div>
  );
};

export default Landing;
