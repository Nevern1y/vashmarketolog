"use client";

import { useEffect, useState, useCallback } from "react";
import { Sun, Moon } from "lucide-react";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme") as "light" | "dark" | null;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return stored || (prefersDark ? "dark" : "light");
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute("data-theme", theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) return;

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Sun className="h-5 w-5 transition-opacity opacity-100 text-primary" />
        <button
          aria-label="Toggle theme"
          className={`relative flex h-6 w-12 items-center rounded-full 
            bg-primary/10 dark:bg-primary/20 
            transition-colors duration-300
            hover:bg-primary/20 dark:hover:bg-primary/30
            focus:outline-none focus:ring-2 focus:ring-primary`}
        >
          <span className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 translate-x-0" />
        </button>
        <Moon className="h-5 w-5 transition-opacity opacity-30" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Sun
        className={`h-5 w-5 transition-opacity ${theme === "light" ? "opacity-100 text-primary" : "opacity-30"
          }`}
      />

      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className={`relative flex h-6 w-12 items-center rounded-full 
          bg-primary/10 dark:bg-primary/20 
          transition-colors duration-300
          hover:bg-primary/20 dark:hover:bg-primary/30
          focus:outline-none focus:ring-2 focus:ring-primary`}
      >
        <span
          className={`absolute left-1 h-4 w-4 rounded-full bg-white shadow-md
            transition-all duration-300
            ${theme === "dark" ? "translate-x-6" : "translate-x-0"}`}
        />
      </button>

      <Moon
        className={`h-5 w-5 transition-opacity ${theme === "dark" ? "opacity-100 text-primary" : "opacity-30"
          }`}
      />
    </div>
  );
}
