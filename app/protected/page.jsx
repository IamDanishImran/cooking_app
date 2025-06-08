// app\protected\page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { InfoIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProtectedPage() {
  const [cuisineType, setCuisineType] = useState("");
  const [mealType, setMealType] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState("");
  const [cookingDifficulty, setCookingDifficulty] = useState("");
  const [cookingTime, setCookingTime] = useState("");
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
      {/* Banner */}
      <section className="flex w-full h-32 rounded bg-rose-500 items-center justify-center text-white">
        <h1 className="text-4xl font-bold">Cooking Platform</h1>
      </section>

      {/* Search Filter */}
      <section className="flex flex-col w-full rounded bg-rose-500 text-white">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-xl">Search Panel</h1>
        </div>

        <article className="flex flex-col md:flex-row gap-4 w-full p-4">
          {/* Cuisine Type */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label htmlFor="cuisineType" className="text-sm font-medium">Cuisine Type</label>
            <select
              id="cuisineType"
              className="border p-2 rounded-md shadow-sm text-black text-sm"
              value={cuisineType}
              onChange={(e) => setCuisineType(e.target.value)}
            >
              <option value="">Choose Cuisine Type</option>
              <option value="Malaysian">Malaysian</option>
              <option value="Thai">Thai</option>
            </select>
          </div>

          {/* Meal Type */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label htmlFor="mealType" className="text-sm font-medium">Meal Type</label>
            <select
              id="mealType"
              className="border p-2 rounded-md shadow-sm text-black text-sm"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
            >
              <option value="">Choose Meal Type</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>

          {/* Meal Type */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label htmlFor="dietaryPreferences" className="text-sm font-medium">Dietary Preferences</label>
            <select
              id="mealType"
              className="border p-2 rounded-md shadow-sm text-black text-sm"
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
            >
              <option value="">Choose Meal Type</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>

          {/* Meal Type */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label htmlFor="cookingDifficulty" className="text-sm font-medium">Cooking Difficulty</label>
            <select
              id="cookingDifficulty"
              className="border p-2 rounded-md shadow-sm text-black text-sm"
              value={cookingDifficulty}
              onChange={(e) => setCookingDifficulty(e.target.value)}
            >
              <option value="">Choose Meal Type</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>

          {/* Meal Type */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label htmlFor="cookingTime" className="text-sm font-medium">Preparation Time</label>
            <select
              id="cookingTime"
              className="border p-2 rounded-md shadow-sm text-black text-sm"
              value={cookingTime}
              onChange={(e) => setCookingTime(e.target.value)}
            >
              <option value="">Choose Meal Type</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>
        </article>
        {/* Display Badges Base on the filter & display button*/}
        <section className="flex w-full justify-between rounded bg-violet-500 text-white">
          <article className="flex items-center justify-between p-4 gap-x-4">
            <Badge className="p-2 text-normal">Malaysian</Badge>
            <Badge className="p-2 text-normal">Malaysian</Badge>
            <Badge className="p-2 text-normal">Malaysian</Badge>
            <Badge className="p-2 text-normal">Malaysian</Badge>
          </article>
          <article className="flex items-center justify-between p-4">
            <Button>
              Add Recipe
            </Button>
          </article>
        </section>
      </section>
    </div>
  );
}
