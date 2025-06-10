// app/protected/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SearchBar from "@/components/search-bar";

export default function ProtectedPage() {
  const router = useRouter();

  // State to hold recipes, loading status, and any errors
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This useEffect handles authentication, as before.
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

  // This new useEffect fetches the recipe data from your API.
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        // Fetch data from your local API endpoint
        const response = await fetch('http://localhost:3002/api/recipes-with-images');

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setRecipes(result.data);
        } else {
          throw new Error(result.error || 'An unknown error occurred');
        }
      } catch (e) {
        console.error("Failed to fetch recipes:", e);
        setError(e.message);
      } finally {
        // Whether it succeeds or fails, we're done loading.
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []); // The empty dependency array [] ensures this runs only once on mount

  // Helper function to render the main content based on state
  const renderContent = () => {
    if (loading) {
      return <p className="text-center">Loading recipes...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500">Error: {error}</p>;
    }
    
    if (recipes.length === 0) {
        return <p className="text-center text-gray-500">No recipes found.</p>
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div key={recipe.recipe_id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            {recipe.image_data ? (
              <img
                // Use a data URI to display the Base64 encoded image
                src={`data:image/jpeg;base64,${recipe.image_data}`}
                alt={recipe.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No Image Provided</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="text-xl font-bold truncate">{recipe.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Published on: {new Date(recipe.date_time).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-4">
      <section className="flex w-full h-32 rounded bg-sky-600 items-center justify-center text-white">
        <h1 className="text-4xl font-bold">Cooking Platform</h1>
      </section>
      <SearchBar />
      
      <main className="p-4">
        <h2 className="text-2xl font-semibold mb-6">Discover Recipes</h2>
        {renderContent()}
      </main>
    </div>
  );
}