import { ActivitySection } from "./_components/home/activity-section";
import { FinalCta } from "./_components/home/final-cta";
import { GamesPreview } from "./_components/home/games-preview";
import { Hero } from "./_components/home/hero";
import { PricingSection } from "./_components/home/pricing-section";
import { StatsSection } from "./_components/home/stats-section";
import { WhySection } from "./_components/home/why-section";

export default function Home() {
  return (
    <div className="fade-in relative">
      <Hero />
      <WhySection />
      <GamesPreview />
      <StatsSection />
      <ActivitySection />
      <PricingSection />
      <FinalCta />
    </div>
  );
}
