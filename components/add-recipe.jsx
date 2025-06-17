// components/AddRecipeModal.jsx
"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import imageCompression from 'browser-image-compression';
import { Alert } from "@heroui/alert";

export default function AddRecipeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cuisine: "",
    difficulty: "",
    time: "",
    type: "",
    image: null,
    document: null,
  });

  const [fieldErrors, setFieldErrors] = useState({
    title: false,
    description: false,
    cuisine: false,
    difficulty: false,
    time: false,
    type: false,
    image: false,
    document: false,
  });

  const supabase = createClient();

  const validateForm = () => {
    const errors = {
      title: !formData.title.trim(),
      description: !formData.description.trim(),
      cuisine: !formData.cuisine,
      difficulty: !formData.difficulty,
      time: !formData.time,
      type: !formData.type,
      image: !formData.image,
      document: !formData.document,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(error => error)) {
      return "Please fill in all required fields";
    }
    return null;
  };

  const handleModalOpen = () => {
    setIsOpen(true);
    setMessage(null);
    setIsError(false);
    setFieldErrors({
      title: false,
      description: false,
      cuisine: false,
      difficulty: false,
      time: false,
      type: false,
      image: false,
      document: false,
    });
  };

  const handleModalClose = () => {
    setIsOpen(false);
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({
      title: "",
      description: "",
      cuisine: "",
      difficulty: "",
      time: "",
      type: "",
      image: null,
      document: null,
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFieldErrors(prev => ({ ...prev, [name]: false }));
    if (files && files.length > 0) {
      const file = files[0];
      if (name === "image") {
        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
          setMessage("Please upload a JPG or PNG image.");
          setIsError(true);
          e.target.value = null;
          return;
        }
      } else if (name === "document") {
        const allowedTypes = ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
        if (!allowedTypes.includes(file.type)) {
          setMessage("Please upload a DOC, DOCX, or TXT document.");
          setIsError(true);
          e.target.value = null;
          return;
        }
      }
      setFormData({ ...formData, [name]: file });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setIsError(false);
  
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      setIsError(true);
      setIsLoading(false);
      return;
    }
  
    try {
      const { title, description, cuisine, difficulty, time, type, image, document } = formData;
  
      let imageId = null;
      let documentId = null;
  
      // Get current user ID from USER table
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated.");
  
      const { data: userRecord, error: userFetchError } = await supabase
        .from("USER")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .single();
      if (userFetchError) throw new Error("User not found in USER table.");
      const userId = userRecord.user_id;
  
      //  Insert image to table
      if (image) {
        const compressedImage = await imageCompression(image, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
        });
        const extension = compressedImage.type.split('/')[1].toUpperCase();
        const allowedTypes = ['PNG', 'JPG'];
        const finalImageType = allowedTypes.includes(extension) ? extension : 'PNG';
        const imageArrayBuffer = await compressedImage.arrayBuffer();
        const imageUint8 = Array.from(new Uint8Array(imageArrayBuffer));
        const { data: imageInsert, error: imageInsertError } = await supabase
          .from("image")
          .insert({
            image_data: imageUint8,
            image_type: finalImageType
          })
          .select("image_id")
          .single();     
        if (imageInsertError) throw new Error("Inserting image failed: " + imageInsertError.message);
        imageId = imageInsert.image_id;
        await supabase.from("metadata").insert([
          {
            meta_type: "IMAGE",
            meta_key: "file_name",
            meta_value: compressedImage.name || image.name,
            image_id: imageId
          },
          {
            meta_type: "IMAGE",
            meta_key: "upload_time",
            meta_value: new Date().toISOString(),
            image_id: imageId
          },
          {
            meta_type: "IMAGE",
            meta_key: "file_type",
            meta_value: compressedImage.type || image.type,
            image_id: imageId
          }
        ]);        
      }          
  
      // Insert document to table
      if (document) {
        const docArrayBuffer = await document.arrayBuffer();
        const docUint8 = Array.from(new Uint8Array(docArrayBuffer));
        const docExtension = document.name.split('.').pop().toUpperCase();
        const { data: docInsert, error: docInsertError } = await supabase
          .from("document")
          .insert({ doc_data: docUint8, doc_type: docExtension })
          .select("doc_id")
          .single();
        if (docInsertError) throw new Error("Inserting document failed: " + docInsertError.message);      
        documentId = docInsert.doc_id;
        await Promise.all([
          supabase.from("metadata").insert([
            { meta_type: "DOCUMENT", meta_key: "file_name", meta_value: document.name, doc_id: documentId },
            { meta_type: "DOCUMENT", meta_key: "upload_time", meta_value: new Date().toISOString(), doc_id: documentId },
            { meta_type: "DOCUMENT", meta_key: "file_type", meta_value: document.type, doc_id: documentId }
          ]),
        ]);
      }
  
      // Insert recipe
      const { error: recipeError } = await supabase.from("recipe").insert({
        title,
        description,
        cuisine,
        difficulty: difficulty.toUpperCase(),
        preparation_time: time,
        meal_type: type.toUpperCase(),
        image_id: imageId,
        doc_id: documentId,
        user_id: userId,
      });      
  
      if (recipeError) throw new Error("Error inserting recipe: " + recipeError.message);
  
      setMessage("Recipe submitted successfully!");
      setIsError(false);
      resetFormData();
    } catch (error) {
      console.error("Submission error:", error.message);
      setMessage("Failed to submit recipe: " + error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };  

  return (
    <>
      <div className="flex items-center gap-4">
        <Button onClick={handleModalOpen} className="bg-black text-white px-4 hover:bg-stone-800 transition-all duration-300">
          Add Recipe
        </Button>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Recipe</h3>
              <button onClick={handleModalClose} className="text-gray-400 hover:text-red-500 text-xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input name="title" value={formData.title} onChange={handleChange} disabled={isLoading} autoComplete="off" />
                {fieldErrors.title && <p className="text-red-500 text-xs">Required</p>}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} disabled={isLoading} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600" />
                {fieldErrors.description && <p className="text-red-500 text-xs">Required</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cuisine</Label>
                  <select name="cuisine" value={formData.cuisine} onChange={handleChange} disabled={isLoading} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600">
                    <option value="">Select Cuisine</option>
                    <option value="malay">Malay</option>
                    <option value="chinese">Chinese</option>
                    <option value="indian">Indian</option>
                    <option value="western">Western</option>
                  </select>
                  {fieldErrors.cuisine && <p className="text-red-500 text-xs">Required</p>}
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <select name="difficulty" value={formData.difficulty} onChange={handleChange} disabled={isLoading} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600">
                    <option value="">Select Difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="HARD">Hard</option>
                  </select>
                  {fieldErrors.difficulty && <p className="text-red-500 text-xs">Required</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time</Label>
                  <select name="time" value={formData.time} onChange={handleChange} disabled={isLoading} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600">
                    <option value="">Select Time</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                  </select>
                  {fieldErrors.time && <p className="text-red-500 text-xs">Required</p>}
                </div>
                <div>
                  <Label>Meal Type</Label>
                  <select name="type" value={formData.type} onChange={handleChange} disabled={isLoading} className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600">
                    <option value="">Select Type</option>
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SNACK">Snack</option>
                  </select>
                  {fieldErrors.type && <p className="text-red-500 text-xs">Required</p>}
                </div>
              </div>
              <div>
                <Label>Image</Label>
                <Input type="file" name="image" accept=".jpg,.jpeg,.png" onChange={handleChange} disabled={isLoading} />
                {formData.image && <p className="text-xs">Selected: {formData.image.name}</p>}
                {fieldErrors.image && <p className="text-red-500 text-xs">Required</p>}
              </div>
              <div>
                <Label>Document</Label>
                <Input type="file" name="document" accept=".doc,.docx,.txt" onChange={handleChange} disabled={isLoading} />
                {formData.document && <p className="text-xs">Selected: {formData.document.name}</p>}
                {fieldErrors.document && <p className="text-red-500 text-xs">Required</p>}
              </div>
              <div className="flex justify-end gap-3">
                <button type="submit" disabled={isLoading} className="text-white bg-blue-700 hover:bg-blue-800 px-5 py-2.5 rounded-lg text-sm disabled:opacity-50">{isLoading ? "Submitting..." : "Submit"}</button>
                <button type="button" onClick={handleModalClose} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
