// components\hero.jsx
import { NextLogo } from "./next-logo";
import { SupabaseLogo } from "./supabase-logo";
import { Button } from "./ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export function Hero() {
  return (
    <div className="flex flex-col md:flex-row items-center w-full px-6 py-12 gap-8">
      {/* Text section */}
      <section className="flex-none w-full md:w-[450px] flex flex-col gap-6">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
          Discover Dishes, Get Inspired
        </h1>
        A visual platform for food lovers — explore chef-inspired homemade recipes with mouthwatering photos. Like YouTube, but for sharing the story behind every dish — no videos, just pure cooking inspiration.
        {/* <p className="text-lg md:text-base max-w-xl">
          Upload your homemade recipes and dish photos to inspire others. No login required — just cook, snap, and share!
        </p> */}
        <div>
          <Button asChild size="lg" className="bg-black text-white hover:bg-zinc-600 hover:text-white transitions-all duration-300" variant="outline">
            <Link href="/protected">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Image section */}
      <section className="flex-1 flex justify-center items-center">
        <img
          src="/hero-chef.svg"
          alt="Chef holding a delicious homemade dish"
          className="w-full max-w-[600px] h-auto"
        />
      </section>
    </div>
  );
}

