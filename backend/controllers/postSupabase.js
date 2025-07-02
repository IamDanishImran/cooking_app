// --- START OF FILE postSupabase.js ---

// FIX: Changed back to CommonJS 'require' to match the 'exports' syntax.
const supabase = require('../config/supabase.js');

// --- Functions ---
exports.uploadImage = async (req, res) => {
  try {
    const { title } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    const { data, error } = await supabase
      .from('posts')
      .insert([{ title, image_url: imageUrl }])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
};
exports.testDb = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('USER')
      .select('*');

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      details: err.message
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required"
      });
    }

    const { data, error } = await supabase
      .from('USER')
      .select('*')
      .eq('username', username)
      .eq('password', password);

    if (error) throw error;

    if (data.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password"
      });
    }

    res.status(200).json({
      success: true,
      data: data[0]
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: "Login failed",
      details: err.message
    });
  }
};
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required"
      });
    }

    if (role && !['CHEF', 'STUDENT'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role specified"
      });
    }

    if (username.length < 4) {
      return res.status(400).json({
        success: false,
        error: "Username must be at least 4 characters"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters"
      });
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('USER')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Username already exists",
        details: {
          suggestion: "Please choose a different username"
        }
      });
    }

    console.log('Final insert payload:', {
      username,
      password,
      role,
      roleType: typeof role,
      roleLength: role.length
    });

    const { data: newUser, error: insertError } = await supabase
      .from('USER')
      .insert([{
        username,
        password,
        role: role || null
      }])
      .select();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      data: newUser[0],
      message: "User registered successfully"
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: "Registration failed",
      details: {
        message: err.message,
        code: err.code,
        hint: err.hint
      }
    });
  }
};

exports.createRecipeWithMedia = async (req, res) => {
  try {
    const { user_id, title, description, cuisine } = req.body;

    if (!req.files || !req.files['doc_data'] || !req.files['image_data']) {
      return res.status(400).json({
        success: false,
        error: "Both document and image files are required",
      });
    }

    const doc_buffer = req.files['doc_data'][0].buffer;
    const image_buffer = req.files['image_data'][0].buffer;

    const doc_data_hex = '\\x' + doc_buffer.toString('hex');
    const image_data_hex = '\\x' + image_buffer.toString('hex');

    const { data, error } = await supabase.rpc('create_recipe_with_media', {
      p_user_id: user_id,
      p_title: title,
      p_description: description,
      p_cuisine: cuisine,
      p_doc_data: doc_data_hex,
      p_image_data: image_data_hex
    }).select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data
    });

  } catch (err) {
    console.error('Error in createRecipeWithMedia:', err);
    const statusCode = err.message.includes('User does not exist') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: err.message,
    });
  }
};

exports.getRecipesWithImages = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recipe')
      .select(`
        recipe_id,
        title,
        date_time,
        image: image_id (
          image_data
        )
      `);

    if (error) throw error;

    const results = data.map(item => {
      let imageBase64 = null;

      if (item.image?.image_data) {
        try {
          const hexString = item.image.image_data.substring(2);
          const buffer = Buffer.from(hexString, 'hex');

          let finalBuffer = buffer;
          try {
            const parsed = JSON.parse(buffer.toString('utf-8'));
            if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
              finalBuffer = Buffer.from(parsed.data);
            }
          } catch (_jsonError) {
            // This is expected for correctly stored data.
          }

          imageBase64 = finalBuffer.toString('base64');
        } catch (processingError) {
          console.error(`Failed to process image for recipe "${item.title}":`, processingError);
        }
      }

      return {
        recipe_id: item.recipe_id,
        title: item.title,
        date_time: item.date_time,
        image_data: imageBase64,
      };
    });

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recipes",
      details: err.message
    });
  }
};

exports.getRecipeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: "Recipe ID is required." });
    }

    const { data, error } = await supabase
      .from('recipe')
      .select(`
        title,
        description,
        cuisine,
        date_time,
        document:doc_id ( doc_data ),
        image:image_id ( image_data )
      `)
      .eq('recipe_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: "Recipe not found" });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    let imageBase64 = null;
    if (data.image?.image_data) {
      try {
        const hexString = data.image.image_data.substring(2);
        const buffer = Buffer.from(hexString, 'hex');

        let finalBuffer = buffer;
        try {
          const parsed = JSON.parse(buffer.toString('utf-8'));
          if (parsed?.type === 'Buffer' && Array.isArray(parsed.data)) {
            finalBuffer = Buffer.from(parsed.data);
          }
        // FIX: The linter is off, but this is still good practice for unused variables
        } catch (_e) { /* Not old malformed data, which is good */ }

        imageBase64 = finalBuffer.toString('base64');
      // FIX: The linter is off, but we should still catch a named error
      } catch (processingError) {
        console.error("Error processing image data for recipe " + id, processingError);
      }
    }

    let docBase64 = null;
    if (data.document?.doc_data) {
      try {
        const hexString = data.document.doc_data.substring(2);
        const buffer = Buffer.from(hexString, 'hex');

        let finalBuffer = buffer;
        try {
          const parsed = JSON.parse(buffer.toString('utf-8'));
          if (parsed?.type === 'Buffer' && Array.isArray(parsed.data)) {
            finalBuffer = Buffer.from(parsed.data);
          }
        // FIX: The linter is off, but this is still good practice for unused variables
        } catch (_e) { /* Not old malformed data, which is good */ }

        docBase64 = finalBuffer.toString('base64');
      // FIX: The linter is off, but we should still catch a named error
      } catch (processingError) {
        console.error("Error processing document data for recipe " + id, processingError);
      }
    }

    const result = {
      title: data.title,
      description: data.description,
      cuisine: data.cuisine,
      date_time: data.date_time,
      image_data: imageBase64,
      doc_data: docBase64,
    };

    res.status(200).json({ success: true, data: result });

  } catch (err) {
    console.error('Error fetching recipe detail:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recipe details",
      details: err.message
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: "Request body is missing. Ensure 'Content-Type' header is set to 'application/json'."
      });
    }

    const { recipe_id } = req.params;
    const { user_id, comment_content } = req.body;

    if (!user_id || !comment_content) {
      return res.status(400).json({
        success: false,
        error: "User ID and comment content are required.",
      });
    }

    if (typeof comment_content !== 'string' || comment_content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Comment content cannot be empty."
      });
    }

    const { data: newComment, error: insertError } = await supabase
      .from('comment')
      .insert([
        {
          recipe_id: parseInt(recipe_id, 10),
          user_id,
          comment_content,
        },
      ])
      .select();

    if (insertError) {
      if (insertError.code === '23503') {
        return res.status(404).json({
          success: false,
          error: "The specified user or recipe does not exist.",
          details: insertError.message
        });
      }
      throw insertError;
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      data: newComment[0],
    });

  } catch (err) {
    console.error('--- ERROR IN addComment ---');
    console.error('Caught error object:', err);
    console.error('---------------------------');

    res.status(500).json({
      success: false,
      error: "Failed to add comment.",
      details: {
        message: err.message || 'An unexpected error occurred. Check server logs for more details.',
        code: err.code || 'UNKNOWN',
      },
    });
  }
};

exports.getCommentsForRecipe = async (req, res) => {
  try {
    const { recipe_id } = req.params;

    if (!recipe_id) {
      return res.status(400).json({ success: false, error: "Recipe ID is required." });
    }

    const { data, error } = await supabase
      .from('comment')
      .select(`
                comment_content,
                comment_datetime,
                USER (
                    username
                )
            `)
      .eq('recipe_id', recipe_id)
      .order('comment_datetime', { ascending: true });

    if (error) throw error;

    const formattedData = data.map(comment => ({
      comment_content: comment.comment_content,
      comment_datetime: comment.comment_datetime,
      username: comment.USER ? comment.USER.username : 'Unknown User'
    }));

    res.status(200).json({
      success: true,
      data: formattedData
    });

  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch comments.",
      details: { message: err.message, code: err.code }
    });
  }
};

exports.searchRecipes = async (req, res) => {
  try {
    const { cuisine, meal_type, difficulty, preparation_time } = req.body;

    // Start building the query
    let query = supabase
      .from('recipe')
      .select(`
        recipe_id,
        title,
        date_time,
        image: image_id (
          image_data
        )
      `);

    // Dynamically add case-insensitive filters for provided criteria
    if (cuisine) {
      query = query.ilike('cuisine', cuisine);
    }
    if (meal_type) {
      query = query.ilike('meal_type', meal_type);
    }
    if (difficulty) {
      query = query.ilike('difficulty', difficulty);
    }
    if (preparation_time) {
      query = query.ilike('preparation_time', preparation_time);
    }

    // Execute the final query
    const { data, error } = await query;

    if (error) throw error;

    // Process results to match the format of getRecipesWithImages for frontend consistency
    const results = data.map(item => {
      let imageBase64 = null;
      if (item.image?.image_data) {
        try {
          const hexString = item.image.image_data.substring(2);
          const buffer = Buffer.from(hexString, 'hex');
          let finalBuffer = buffer;
          try {
            const parsed = JSON.parse(buffer.toString('utf-8'));
            if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
              finalBuffer = Buffer.from(parsed.data);
            }
          } catch (_e) { /* ignore */ }
          imageBase64 = finalBuffer.toString('base64');
        } catch (processingError) {
          console.error(`Failed to process image for recipe "${item.title}":`, processingError);
        }
      }
      return {
        recipe_id: item.recipe_id,
        title: item.title,
        date_time: item.date_time,
        image_data: imageBase64,
      };
    });

    res.status(200).json({
      success: true,
      data: results,
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      success: false,
      error: "Failed to search for recipes",
      details: err.message
    });
  }
};