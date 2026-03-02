const express = require("express");
const roleRoutes = require("./routes/role.routes");
const userRoutes = require("./routes/user.routes");
const { enableUser, disableUser } = require("./controllers/user.controller");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "User Role API is running" });
});

app.post("/enable", enableUser);
app.post("/disable", disableUser);

app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyValue || {})[0] || "field";
    return res.status(409).json({
      message: `${duplicateField} already exists`,
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
