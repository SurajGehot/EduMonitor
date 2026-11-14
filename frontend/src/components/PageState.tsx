import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

export function LoadingState({ label = "Loading data..." }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-[#77736A]">
      <LoaderCircle className="animate-spin text-[#AA8D54]" size={25} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-[#E8D5CF] bg-[#FBF6F3] p-6 text-center">
      <AlertCircle size={25} className="text-[#C87567]" />
      <p className="max-w-xl text-sm text-[#79564E]">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-[#292824] px-4 py-2 text-xs font-medium text-white hover:bg-[#403D35]">
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-semibold text-[#292720]">{title}</p>
      <p className="mt-2 max-w-md text-xs leading-5 text-[#8D887D]">{description}</p>
    </div>
  );
}
