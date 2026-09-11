export default function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-line" />
      <span className="text-xs text-muted font-sans font-bold uppercase tracking-wider">or</span>
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}
