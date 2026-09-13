import { GrokitMascot } from './Grokitmascot';

export function HeroGraphic() {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto md:mx-0">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(244,97,31,0.14) 0%, rgba(244,97,31,0.06) 55%, transparent 75%)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <GrokitMascot size={290} />
      </div>
    </div>
  );
}