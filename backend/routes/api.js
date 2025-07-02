// backend\routes\api.js
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const supbasePosts = require('../controllers/postSupabase')


router.get('/test-db1', supbasePosts.testDb);
router.post('/login', supbasePosts.login);
router.post('/register', supbasePosts.register);
router.post('/create-recipe', upload, (req, res, next) => {
  console.log('Files received:', req.files); // Add this for debugging
  next();
}, supbasePosts.createRecipeWithMedia);
router.get('/recipes-with-images', supbasePosts.getRecipesWithImages);
router.post('/search-recipes', supbasePosts.searchRecipes);
router.get('/recipe/:id', supbasePosts.getRecipeDetail);
router.post('/recipe/:recipe_id/comment', supbasePosts.addComment);
router.get('/recipe/:recipe_id/displaycomments', supbasePosts.getCommentsForRecipe);

module.exports = router;