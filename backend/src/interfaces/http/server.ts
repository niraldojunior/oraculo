import app from './expressApp.js';

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Oraculo API Server running on http://localhost:${PORT}`);
});

