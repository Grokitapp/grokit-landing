import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Hero } from '../components/Hero';
import { HighlightStrip } from '../components/Highlightstrip';
import { BenefitBand } from '../components/Benefitband';
import { HowItWorks } from '../components/Howitworks';
import { InteractivePrompt } from '../components/Interactiveprompt';
import { Credibility } from '../components/Credibility';
import { ProTeaser } from '../components/Proteaser';
import { FAQ } from '../components/Faq';
import { FinalCTA } from '../components/Finalcta';
import { Footer } from '../components/Footer';
import { WaitlistModal } from '../components/Waitlistmodal';

export default function Index() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const openWaitlist = () => setIsWaitlistOpen(true);
  const closeWaitlist = () => setIsWaitlistOpen(false);

  return (
    <div className="bg-surface">
      <Navigation onOpenWaitlist={openWaitlist} />
      <Hero onOpenWaitlist={openWaitlist} />
      <HighlightStrip />
      <BenefitBand />
      <HowItWorks />
      <InteractivePrompt onOpenWaitlist={openWaitlist} />
      <Credibility />
      <ProTeaser onOpenWaitlist={openWaitlist} />
      <FAQ />
      <FinalCTA onOpenWaitlist={openWaitlist} />
      <Footer />
      <WaitlistModal isOpen={isWaitlistOpen} onClose={closeWaitlist} />
    </div>
  );
}