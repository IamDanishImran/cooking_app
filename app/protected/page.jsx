// app/protected/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import the Link component for navigation
import { createClient } from "@/lib/supabase/client";
import SearchBar from "@/components/search-bar";

export default function ProtectedPage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This useEffect handles authentication
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

  // This useEffect fetches the recipe data from your API
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
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
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

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
          // We use flexbox to help align the button to the bottom of the card
          <div key={recipe.recipe_id} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            {recipe.image_data ? (
              <img
                src={`data:image/jpeg;base64,${recipe.image_data}`}
                alt={recipe.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No Image Provided</span>
              </div>
            )}
            {/* 'flex-grow' allows this div to take up available space, pushing the button down */}
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-xl font-bold truncate">{recipe.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Published on: {new Date(recipe.date_time).toLocaleDateString()}
              </p>
              
              {/* 'mt-auto' pushes this div to the bottom of its flex container */}
              <div className="mt-auto pt-4"> 
                <Link href={`/protected/recipes/${recipe.recipe_id}`} passHref>
                  <span className="block w-full text-center bg-sky-600 text-white font-semibold py-2 px-4 rounded hover:bg-sky-700 transition-colors duration-300 cursor-pointer">
                    View Details
                  </span>
                </Link>
              </div>
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