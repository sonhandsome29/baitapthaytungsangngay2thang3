const express = require("express");
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  enableUser,
  disableUser,
} = require("../controllers/user.controller");

const router = express.Router();

router.post("/", createUser);
router.get("/", getAllUsers);
router.post("/enable", enableUser);
router.post("/disable", disableUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", softDeleteUser);

module.exports = router;
