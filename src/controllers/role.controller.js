const mongoose = require("mongoose");
const Role = require("../models/role.model");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const role = await Role.create({ name, description });
    return res.status(201).json(role);
  } catch (error) {
    return next(error);
  }
};

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({ isDeleted: false }).sort({ createdAt: -1 });
    return res.json(roles);
  } catch (error) {
    return next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const role = await Role.findOne({ _id: id, isDeleted: false });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.json(role);
  } catch (error) {
    return next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const role = await Role.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.json(role);
  } catch (error) {
    return next(error);
  }
};

const softDeleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid role id" });
    }

    const role = await Role.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.json({ message: "Role soft deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  softDeleteRole,
};
