"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// The SearchBar now receives onSearch and onReset functions as props.
// It no longer handles fetching or auth checks itself.
export default function SearchBar({ onSearch, onReset }) {
  const [cuisineType, setCuisineType] = useState("");
  const [mealType, setMealType] = useState("");
  const [cookingDifficulty, setCookingDifficulty] = useState("");
  const [cookingTime, setCookingTime] = useState("");

  // This function is called when the user clicks "Search Recipes"
  const handleSearch = () => {
    // We build a filters object with the correct keys for the API
    const filters = {
      cuisine: cuisineType || undefined,
      meal_type: mealType || undefined,
      difficulty: cookingDifficulty || undefined,
      preparation_time: cookingTime || undefined,
    };
    
    // Remove any empty/undefined keys before sending
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    // Call the onSearch function passed down from the parent page
    onSearch(filters);
  };
  
  // This function is called when the user clicks "Reset"
  const handleReset = () => {
    // Clear all the local input states
    setCuisineType("");
    setMealType("");
    setCookingDifficulty("");
    setCookingTime("");
    // Call the onReset function passed down from the parent page
    onReset();
  };

  return (
    <>
      <section className="flex flex-col w-full rounded border text-black bg-[#ffffff]">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-bold text-xl">Search Panel</h1>
        </div>

        <article className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full px-4">
          {/* Cuisine Type */}
          <div className="flex flex-col gap-2 w-full">
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
          <div className="flex flex-col gap-2 w-full">
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
          
          {/* Cooking Difficulty */}
          <div className="flex flex-col gap-2 w-full">
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
          <div className="flex flex-col gap-2 w-full">
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

        {/* Filter Badges & Buttons */}
        <article className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4 text-white rounded">
          <div className="flex flex-wrap gap-2">
            {/* Show badges for any active filters */}
            {[cuisineType, mealType, cookingDifficulty, cookingTime]
                .filter(Boolean)
                .map((value, index) => (
                  <Badge key={index} className="p-2 text-normal">
                    {value}
                  </Badge>
                ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <Button onClick={handleSearch}>Search Recipes</Button>
            <Button onClick={handleReset}>Reset</Button>
          </div>
        </article>
      </section>
    </>
  );
}