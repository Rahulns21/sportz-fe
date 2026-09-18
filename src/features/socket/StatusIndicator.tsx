interface StatusIndicatorProps {
  connected: boolean;
}

export function StatusIndicator({ connected }: StatusIndicatorProps) {
  const color = connected ? "bg-green-400" : "bg-gray-300";
  const text = connected ? "Live Connected" : "Offline";

  return (
    <div className="shadow-hard-sm flex items-center gap-2 rounded-lg border-2 border-black bg-white px-3 py-1.5">
      <div className={`h-3 w-3 rounded-full border border-black ${color}`} />
      <span className="text-xs font-bold tracking-wide uppercase">{text}</span>
    </div>
  );
}
