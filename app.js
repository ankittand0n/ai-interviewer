const pool = require('./db');

// Example query
async function fetchUsers() {
  try {
    const res = await pool.query('SELECT * FROM ai_interviewer'); // Replace 'users' with your table name
    console.log('Users:', res.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  }
}

fetchUsers();
