const express = require("express");
const {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  softDeleteRole,
} = require("../controllers/role.controller");

const router = express.Router();

router.post("/", createRole);
router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.put("/:id", updateRole);
router.delete("/:id", softDeleteRole);

module.exports = router;
