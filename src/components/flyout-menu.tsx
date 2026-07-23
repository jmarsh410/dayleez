import Link from "next/link";

export function FlyoutMenu({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="group relative">
      <button type="button" className="flex cursor-pointer items-center gap-1">
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div className="invisible absolute right-0 top-full z-10 flex min-w-32 flex-col gap-1 rounded border border-foreground/10 bg-background p-2 opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
