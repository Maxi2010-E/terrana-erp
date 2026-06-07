type SuccessFlashProps = {
  message: string;
};

export function SuccessFlash({ message }: SuccessFlashProps) {
  return (
    <p
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200"
      role="status"
    >
      {message}
    </p>
  );
}
