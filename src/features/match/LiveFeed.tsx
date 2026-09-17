import type { Commentary } from "../../types";

interface LiveFeedProps {
  messages: Commentary[];
  isActive: boolean;
  isLoading?: boolean;
}

const formatMinute = (minute: number | null) => {
  if (minute === null) return null;
  return `${minute}`;
};

const renderMetadata = (metadata: Record<string, unknown> | null) => {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {Object.entries(metadata).map(([key, value]) => (
        <span
          key={key}
          className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px]"
        >
          <span className="font-mono text-gray-500">{key}:</span>{" "}
          <span className="font-semibold text-gray-800">
            {typeof value === "string" ? value : JSON.stringify(value)}
          </span>
        </span>
      ))}
    </div>
  );
};

export function LiveFeed({ messages, isActive, isLoading }: LiveFeedProps) {
  if (!isActive) {
    return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black bg-gray-50 p-8 text-center">
        <div className="bg-brand-yellow mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-black">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold">No Match Selected</h3>
        <p className="max-w-xs text-gray-500">
          Select a match from the list to view line commentary and real-time
          updates.
        </p>
      </div>
    );
  }

  return (
    <div className="shadow-hard flex h-full flex-col overflow-hidden rounded-2xl border-2 border-black bg-white">
      <div className="bg-brand-blue flex items-center justify-between border-b-2 border-black p-4">
        <h3 className="text-lg font-bold">Live Commentary</h3>
        <span className="rounded-md border border-black bg-white px-2 py-0.5 text-xs font-medium">
          Real-time
        </span>
      </div>

      <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="py-10 text-center text-gray-400 italic">
            Loading commentary...
          </div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-gray-400 italic">
            Waiting for updates...
          </div>
        ) : (
          messages.map((msg) => {
            const timeStamp = msg.createdAt
              ? new Date(msg.createdAt)
              : new Date();
            const minuteLabel = formatMinute(msg.minutes);

            return (
              <div
                key={msg.id}
                className="animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <div className="flex gap-3">
                  <div className="mt-1 flex flex-col items-center gap-1">
                    <div className="bg-brand-yellow h-2 w-2 rounded-full border border-black"></div>
                    <div className="h-full w-0.5 bg-gray-200"></div>
                  </div>
                  <div className="pb-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono text-gray-400">
                        {timeStamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      {minuteLabel && (
                        <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 font-semibold">
                          {minuteLabel}
                        </span>
                      )}
                      {msg.sequence !== null && (
                        <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 font-semibold">
                          Seq {msg.sequence}
                        </span>
                      )}
                      {msg.period && (
                        <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5">
                          {msg.period}
                        </span>
                      )}
                      {msg.eventType && (
                        <span className="bg-brand-yellow rounded-full border border-black px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                          {msg.eventType}
                        </span>
                      )}
                    </div>
                    {(msg.actor || msg.team) && (
                      <div className="mb-2 text-xs font-semibold text-gray-700">
                        {msg.actor ? msg.actor : "Unknown"}
                        {msg.team ? ` · ${msg.team}` : ""}
                      </div>
                    )}
                    <p className="rounded-xl rounded-tl-none border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed font-medium text-gray-800">
                      {msg.message}
                    </p>
                    {renderMetadata(msg.metadata)}
                    {msg.tags && msg.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.tags.map((tag) => (
                          <span
                            key={`${msg.id}-${tag}`}
                            className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] tracking-wide text-gray-500 uppercase"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
