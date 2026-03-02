const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const Role = require("../models/role.model");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const rolePopulation = {
  path: "role",
  select: "name description",
  match: { isDeleted: false },
};

const sanitizeUserUpdate = (payload) => {
  const allowedFields = [
    "username",
    "password",
    "email",
    "fullName",
    "avatarUrl",
    "status",
    "role",
    "loginCount",
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updateData[field] = payload[field];
    }
  }

  if (updateData.email) {
    updateData.email = String(updateData.email).toLowerCase();
  }

  return updateData;
};

const ensureRoleExists = async (roleId) => {
  if (roleId === undefined || roleId === null || roleId === "") {
    return true;
  }

  if (!isValidObjectId(roleId)) {
    return false;
  }

  const role = await Role.findOne({ _id: roleId, isDeleted: false });
  return Boolean(role);
};

const createUser = async (req, res, next) => {
  try {
    const {
      username,
      password,
      email,
      fullName,
      avatarUrl,
      status,
      role,
      loginCount,
    } = req.body;

    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ message: "username, password and email are required" });
    }

    const validRole = await ensureRoleExists(role);

    if (!validRole) {
      return res.status(400).json({ message: "Invalid or deleted role" });
    }

    const createdUser = await User.create({
      username,
      password,
      email: String(email).toLowerCase(),
      fullName,
      avatarUrl,
      status,
      role,
      loginCount,
    });

    const user = await User.findById(createdUser._id).populate(rolePopulation);

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: false })
      .populate(rolePopulation)
      .sort({ createdAt: -1 });

    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findOne({ _id: id, isDeleted: false }).populate(
      rolePopulation
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const updateData = sanitizeUserUpdate(req.body);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (updateData.role === "") {
      updateData.role = null;
    }

    if (updateData.role !== undefined) {
      const validRole = await ensureRoleExists(updateData.role);

      if (!validRole) {
        return res.status(400).json({ message: "Invalid or deleted role" });
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    ).populate(rolePopulation);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

const softDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User soft deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

const updateUserStatusByIdentity = async (req, res, next, nextStatus) => {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res
        .status(400)
        .json({ message: "email and username are required" });
    }

    const user = await User.findOneAndUpdate(
      {
        email: String(email).toLowerCase(),
        username,
        isDeleted: false,
      },
      {
        status: nextStatus,
      },
      { new: true, runValidators: true }
    ).populate(rolePopulation);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or information mismatch" });
    }

    return res.json({
      message: `User ${nextStatus ? "enabled" : "disabled"} successfully`,
      user,
    });
  } catch (error) {
    return next(error);
  }
};

const enableUser = async (req, res, next) =>
  updateUserStatusByIdentity(req, res, next, true);

const disableUser = async (req, res, next) =>
  updateUserStatusByIdentity(req, res, next, false);

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  enableUser,
  disableUser,
};
