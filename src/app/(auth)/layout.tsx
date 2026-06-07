export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex h-full items-center justify-center overflow-y-auto p-6"
      style={{
        background: `linear-gradient(145deg, #2b2e34 0%, #35383e 55%, #3a2518 100%)`,
      }}
    >
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
