// app/protected/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SearchBar from "@/components/search-bar";

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/auth/login");
      }
    };
    checkUser();
  }, [router]);

  return (
    <div className="flex-1 w-full flex flex-col gap-4">
      <section className="flex w-full h-32 rounded bg-sky-600 items-center justify-center text-white">
        <h1 className="text-4xl font-bold">Cooking Platform</h1>
      </section>
      <SearchBar />
    </div>
  );
}
