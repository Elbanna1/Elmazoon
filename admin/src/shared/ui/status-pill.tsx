/** The one place a question's status is rendered, so it cannot drift between views. */
export function StatusPill({ answered }: { answered: boolean }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
        answered ? "bg-success/10 text-success" : "bg-gold-50 text-gold-700"
      }`}
    >
      {answered ? "تم الرد" : "بانتظار الرد"}
    </span>
  );
}
