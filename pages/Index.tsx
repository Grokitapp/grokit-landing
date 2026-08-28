import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Hero } from '../components/Hero';
import { TrustStrip } from '../components/Truststrip';
import { HowItWorks } from '../components/Howitworks';
import { InteractivePrompt } from '../components/Interactiveprompt';
import { GrokitDifference } from '../components/Grokitdifference';
import { FAQ } from '../components/Faq';
import { FinalCTA } from '../components/Finalcta';
import { Footer } from '../components/Footer';
import { WaitlistModal } from '../components/Waitlistmodal';

export default function Index() {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  const openWaitlist = () => setIsWaitlistOpen(true);
  const closeWaitlist = () => setIsWaitlistOpen(false);

  return (
    <div className="bg-black">
      <Navigation onOpenWaitlist={openWaitlist} />
      <Hero onOpenWaitlist={openWaitlist} />
      <TrustStrip />
      <HowItWorks />
      <InteractivePrompt onOpenWaitlist={openWaitlist} />
      <GrokitDifference />
      <FAQ />
      <FinalCTA onOpenWaitlist={openWaitlist} />
      <Footer />
      <WaitlistModal isOpen={isWaitlistOpen} onClose={closeWaitlist} />
    </div>
  );
}