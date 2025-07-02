// app/protected/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SearchBar from "@/components/search-bar";

// --- MODAL COMPONENT ---
// A self-contained component for displaying recipe details in a popup.
const RecipeDetailModal = ({ recipe, onClose, isLoading }) => {
  if (!recipe) return null;

  // Function to view/download the document, adapted from your index.tsx
  const viewDocument = (docBase64, title) => {
    if (!docBase64) return;

    let mimeType;
    try {
      // Check the "magic number" to see if it's a PDF
      const decodedStart = atob(docBase64.substring(0, 8));
      if (decodedStart.startsWith('%PDF')) {
        mimeType = 'application/pdf';
      } else {
        // Otherwise, assume it's plain text
        mimeType = 'text/plain';
      }
    } catch (e) {
      console.error("Could not determine file type, defaulting to generic stream.", e);
      mimeType = 'application/octet-stream';
    }
    
    // Convert base64 to a Blob and create a URL to open
    const byteCharacters = atob(docBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const file = new Blob([byteArray], { type: mimeType });
    const fileURL = URL.createObjectURL(file);
    window.open(fileURL, '_blank');
  };

  return (
    // Modal Overlay
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose} // Close modal if overlay is clicked
    >
      {/* Modal Content */}
      <div 
        className="bg-white rounded-lg shadow-2xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-3xl font-bold"
        >
          ×
        </button>
        
        {isLoading ? (
          <p className="text-center py-10">Loading details...</p>
        ) : recipe.error ? (
          <p className="text-center py-10 text-red-600">Error: {recipe.error}</p>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-2">{recipe.title}</h2>
            <p className="text-lg text-gray-500 italic mb-4">{recipe.cuisine}</p>

            {recipe.image_data && (
              <img
                src={`data:image/jpeg;base64,${recipe.image_data}`}
                alt={recipe.title}
                className="w-full max-h-96 object-contain rounded-md my-4"
              />
            )}
            
            <h3 className="text-xl font-semibold mt-6 border-b pb-2 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{recipe.description || "No description provided."}</p>
            
            <p className="text-sm text-gray-500 mt-6">
              Published on: {new Date(recipe.date_time).toLocaleString()}
            </p>

            {recipe.doc_data && (
              <div className="mt-8">
                <button
                  onClick={() => viewDocument(recipe.doc_data, recipe.title)}
                  className="w-full md:w-auto bg-green-600 text-white font-semibold py-2 px-6 rounded hover:bg-green-700 transition-colors duration-300"
                >
                  View Document
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


export default function ProtectedPage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NEW STATE FOR MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

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
  
  // MODIFIED: Centralized function for fetching recipes
  const fetchRecipes = async (filters = null) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      const hasFilters = filters && Object.keys(filters).length > 0;

      if (hasFilters) {
        // If filters are provided, call the search API
        response = await fetch('http://localhost:3002/api/search-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters)
        });
      } else {
        // Otherwise, fetch all recipes
        response = await fetch('http://localhost:3002/api/recipes-with-images');
      }

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
      setRecipes([]); // Clear recipes on error
    } finally {
      setLoading(false);
    }
  };


  // This useEffect fetches the initial recipe list when the component mounts
  useEffect(() => {
    fetchRecipes();
  }, []);

  // --- NEW FUNCTIONS TO HANDLE MODAL ---
  const handleViewDetails = async (recipeId) => {
    setIsModalOpen(true);
    setIsModalLoading(true);
    setSelectedRecipe(null); // Clear previous data

    try {
      const response = await fetch(`http://localhost:3002/api/recipe/${recipeId}`);
      if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(errorBody.error || `Request failed with status ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setSelectedRecipe(result.data);
      } else {
        throw new Error(result.error || "Failed to load recipe details.");
      }
    } catch (err) {
      console.error("Failed to fetch recipe details:", err);
      // Pass an error object to the modal for display
      setSelectedRecipe({ error: err.message });
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  // Helper function to render the main content based on state
  const renderContent = () => {
    if (loading) {
      return <p className="text-center">Loading recipes...</p>;
    }

    if (error) {
      return <p className="text-center text-red-500">Error: {error}</p>;
    }
    
    if (recipes.length === 0) {
        return <p className="text-center text-gray-500">No recipes found. Try adjusting your search filters.</p>
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
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
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-xl font-bold truncate">{recipe.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Published on: {new Date(recipe.date_time).toLocaleDateString()}
              </p>
              
              <div className="mt-auto pt-4"> 
                {/* CHANGED: This is now a button that opens the modal */}
                <button 
                  onClick={() => handleViewDetails(recipe.recipe_id)}
                  className="block w-full text-center bg-sky-600 text-white font-semibold py-2 px-4 rounded hover:bg-sky-700 transition-colors duration-300 cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 w-full flex flex-col gap-4">
        <section className="flex w-full h-32 rounded bg-sky-600 items-center justify-center text-white">
          <h1 className="text-4xl font-bold">Cooking Platform</h1>
        </section>

        {/* MODIFIED: Pass handler functions to SearchBar */}
        <SearchBar onSearch={fetchRecipes} onReset={() => fetchRecipes()} />
        
        <main className="p-4">
          <h2 className="text-2xl font-semibold mb-6">Discover Recipes</h2>
          {renderContent()}
        </main>
      </div>

      {/* RENDER THE MODAL when it's open */}
      {isModalOpen && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          isLoading={isModalLoading}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}