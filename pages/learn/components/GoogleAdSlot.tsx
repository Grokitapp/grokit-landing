import { useEffect } from 'react';

import { ADSENSE_CLIENT_ID } from '../../../lib/ads';

// -----------------------------------------------------------------------------
// OPTIONAL. Not used anywhere yet. Only turn this on after:
//   1. Google AdSense has approved the site,
//   2. the crawler login is set up (Google can't see pages behind a login), and
//   3. you show a consent banner where the law requires one.
// See the step-by-step guide. Until ADSENSE_CLIENT_ID is set it renders nothing.
// -----------------------------------------------------------------------------

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const SCRIPT_ID = 'adsense-script';

function loadAdsenseScript(clientId: string) {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');

  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;

  document.head.appendChild(script);
}

/** One responsive Google ad. `slot` is the ad unit id from your AdSense account. */
export default function GoogleAdSlot({ slot }: { slot: string }) {
  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return;

    loadAdsenseScript(ADSENSE_CLIENT_ID);

    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // Blocked by an ad blocker or not ready yet: the slot just stays empty.
    }
  }, [slot]);

  if (!ADSENSE_CLIENT_ID) return null;

  return (
    <section
      aria-label="Advertisement"
      className="rounded-2xl border border-[#37464F] bg-[#19282E] p-4"
    >
      <span className="rounded-md bg-[#202F35] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#91A4AC]">
        Ad
      </span>

      <ins
        className="adsbygoogle mt-3 block"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </section>
  );
}