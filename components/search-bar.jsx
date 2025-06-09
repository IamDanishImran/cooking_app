"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function SearchBar() {
  const [cuisineType, setCuisineType] = useState("");
  const [mealType, setMealType] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState("");
  const [cookingDifficulty, setCookingDifficulty] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
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

  const handleSearch = async () => {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cuisineType,
        mealType,
        dietaryPreferences,
        cookingDifficulty,
        cookingTime,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      setResults(result.results);
    } else {
      console.error("Search failed:", result.error);
      setResults([]);
    }
    setHasSearched(true);
  };
  

  const handleReset = () => {
    setCuisineType("");
    setMealType("");
    setDietaryPreferences("");
    setCookingDifficulty("");
    setCookingTime("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <section>
      <section className="flex flex-col w-full rounded border text-black bg-[#f1f1f1]">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-xl">Search Panel</h1>
        </div>

        <article className="flex gap-4 w-full p-4">
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

          {/* Dietary Preferences */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label htmlFor="dietaryPreferences" className="text-sm font-medium">Dietary Preferences</label>
            <select
              id="dietaryPreferences"
              className="border p-2 rounded-md shadow-sm text-black text-sm"
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
            >
              <option value="">Choose Dietary Preference</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Halal">Halal</option>
            </select>
          </div>

          {/* Cooking Difficulty */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label htmlFor="cookingDifficulty" className="text-sm font-medium">Cooking Difficulty</label>
            <select
              id="cookingDifficulty"
              className="border p-2 rounded-md shadow-sm text-black text-sm"
              value={cookingDifficulty}
              onChange={(e) => setCookingDifficulty(e.target.value)}
            >
              <option value="">Choose Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Cooking Time */}
          <div className="flex flex-col gap-2 w-full md:w-1/2">
            <label htmlFor="cookingTime" className="text-sm font-medium">Preparation Time</label>
            <select
              id="cookingTime"
              className="border p-2 rounded-md shadow-sm text-black text-sm"
              value={cookingTime}
              onChange={(e) => setCookingTime(e.target.value)}
            >
              <option value="">Choose Time</option>
              <option value="15 mins">15 mins</option>
              <option value="30 mins">30 mins</option>
              <option value="1 hour">1 hour</option>
            </select>
          </div>
        </article>

        {/* Filter Badges + Buttons */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4 text-white rounded">
          <article className="flex flex-wrap gap-2">
            {hasSearched &&
              [cuisineType, mealType, dietaryPreferences, cookingDifficulty, cookingTime]
                .filter(Boolean)
                .map((value, index) => (
                  <Badge key={index} className="p-2 text-normal">
                    {value}
                  </Badge>
                ))}
          </article>
          <div className="flex gap-2 ml-auto">
            <Button onClick={handleSearch}>Search Recipes</Button>
            <Button onClick={handleReset}>Reset</Button>
          </div>
        </section>
      </section>

      <section className="w-full p-4 text-black rounded border">
      <Link href="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
      </section>

      {/* Search Results */}
      <section className="w-full p-4 text-black rounded border bg-[#f1f1f1] mt-4">
        <h2 className="text-lg font-semibold mb-2">Search Results</h2>
        {results.length > 0 ? (
          <ul className="space-y-2">
            {results.map((item) => (
              <li key={item.id} className="p-4 border rounded">
                <h3 className="font-bold">{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          hasSearched && <p>No matching recipes found.</p>
        )}
      </section>
    </section>
  );
}
