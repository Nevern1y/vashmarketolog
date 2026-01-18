"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type Item = { label: string; href: string };

export default function CustomSelect({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openMenu = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const closeMenu = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative group"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
           h-10 px-4 text-sm font-medium
           bg-transparent
           border-b-2 border-transparent
           hover:border-primary
           transition-colors
           flex items-center
           hover:text-primary
        "
      >
        Финансовые продукты
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          className={`ml-2 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="
            absolute left-0 top-full
            mt-2 w-64
            bg-white rounded-lg shadow-lg
            p-2
            animate-in fade-in zoom-in-95
          "
        >
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block px-3 py-2 text-sm hover:bg-muted rounded-md text-black hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
