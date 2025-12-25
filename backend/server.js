const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} 🚀!`);
});
