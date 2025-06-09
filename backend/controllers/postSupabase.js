const supabase = require('../config/supabase'); // Update this path according to your actual file structure

// --- Unchanged Functions (for context) ---
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

    // Query Supabase
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

    // If we get here, login was successful
    res.status(200).json({
      success: true,
      data: data[0] // Return the first matching user
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

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required"
      });
    }

    // Validate role if provided
    if (role && !['CHEF', 'STUDENT'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role specified"
      });
    }

    // Validate username/password complexity
    if (username.length < 4) {
      return res.status(400).json({
        success: false,
        error: "Username must be at least 4 characters"
      });
    }

    // Validate username/password complexity
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters"
      });
    }

    // Check if username already exists
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
  roleType: typeof role,  // Should be "string"
  roleLength: role.length // Should be 4 for "CHEF"
});

    // Insert new user with user_id from sequence
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

    // FIX: Convert buffers to hex strings for Supabase RPC `bytea` type.
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
          // Supabase client returns bytea as a hex string prefixed with '\\x'
          const hexString = item.image.image_data.substring(2);
          const buffer = Buffer.from(hexString, 'hex');
          
          let finalBuffer = buffer;
          // Attempt to parse the buffer as a JSON string to detect old, malformed data
          try {
            const parsed = JSON.parse(buffer.toString('utf-8'));
            if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
              // It's the old format. Reconstruct the buffer from the data array.
              finalBuffer = Buffer.from(parsed.data);
            }
          } catch (jsonError) {
            // This is expected for correctly stored data. The buffer is not JSON.
            // We just use the 'finalBuffer' which is already correctly set.
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

    // Query for the specific recipe and join its document and image
    // Note: I'm assuming your recipe table's primary key is 'recipe_id'.
    // Adjust 'recipe_id' if your primary key has a different name.
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
      .single(); // .single() is perfect for fetching one row. It returns null if not found.

    if (error) {
      // If the error is because no rows were found, send a 404.
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: "Recipe not found" });
      }
      throw error; // For other errors, let the catch block handle it.
    }

    if (!data) {
        return res.status(404).json({ success: false, error: "Recipe not found" });
    }

    // --- Process bytea data for both image and document ---
    
    let imageBase64 = null;
    if (data.image?.image_data) {
      // We'll reuse the robust processing logic from your 'getRecipes' function
      try {
        const hexString = data.image.image_data.substring(2);
        const buffer = Buffer.from(hexString, 'hex');
        
        let finalBuffer = buffer;
        try {
          const parsed = JSON.parse(buffer.toString('utf-8'));
          if (parsed?.type === 'Buffer' && Array.isArray(parsed.data)) {
            finalBuffer = Buffer.from(parsed.data);
          }
        } catch (e) { /* Not old malformed data, which is good */ }

        imageBase64 = finalBuffer.toString('base64');
      } catch (e) {
        console.error("Error processing image data for recipe " + id, e);
      }
    }
    
    let docBase64 = null;
    if (data.document?.doc_data) {
      try {
        // The logic is the same as for the image
        const hexString = data.document.doc_data.substring(2);
        const buffer = Buffer.from(hexString, 'hex');

        let finalBuffer = buffer;
        try {
            const parsed = JSON.parse(buffer.toString('utf-8'));
            if (parsed?.type === 'Buffer' && Array.isArray(parsed.data)) {
              finalBuffer = Buffer.from(parsed.data);
            }
        } catch(e) { /* Not old malformed data, which is good */ }

        docBase64 = finalBuffer.toString('base64');
      } catch (e) {
        console.error("Error processing document data for recipe " + id, e);
      }
    }

    // Prepare the final response object
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
    // --- CHANGE [2] --- Added a check for the request body to diagnose middleware issues.
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

    // --- CHANGE [3] --- Changed table name to lowercase for better compatibility.
    const { data: newComment, error: insertError } = await supabase
      .from('comment') // Use lowercase 'comment'
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
    // --- CHANGE [4] --- Enhanced error logging for easier debugging.
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
        // 1. Extract recipe_id from the URL
        const { recipe_id } = req.params;

        // 2. Validate input
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
            .order('comment_datetime', { ascending: true }); // Order comments chronologically

        if (error) throw error;

        // 4. Format the data for a cleaner response
        const formattedData = data.map(comment => ({
            comment_content: comment.comment_content,
            comment_datetime: comment.comment_datetime,
            // Safely access the username from the nested USER object
            username: comment.USER ? comment.USER.username : 'Unknown User'
        }));

        // 5. Send the successful response
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
