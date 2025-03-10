function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-red-500">{children}</p>;
}

export { Field, FieldError };
