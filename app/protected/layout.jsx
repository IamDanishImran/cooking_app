// app\protected\layout.jsx
import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function ProtectedLayout({ children }) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Cooking Youtube</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}

          </div>
        </nav>
        <div className="flex flex-col gap-20 w-full p-5 px-6 bg-[#f6f6f6]">
          {children}
        </div>
      </div>
    </main>
  );
}
