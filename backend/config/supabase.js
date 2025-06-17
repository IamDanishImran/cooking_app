// backend\config\supabase.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be defined in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('USER')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    console.log('Supabase connected successfully');
  } catch (err) {
    console.error('Supabase connection error:', err.message);
  }
}

testConnection();

module.exports = supabase;