import User from "../models/userModel.js";

const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId },
    }).select("_id name email profilePicture");

    res.status(200).json(users);
  } catch (error) {
    console.log("GET USERS ERROR:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "_id name email profilePicture"
    );

    res.status(200).json(user);
  } catch (error) {
    console.log("GET USER ERROR:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, profilePicture } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name, profilePicture },
      { new: true }
    ).select("_id name email profilePicture");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

export { getUsers, getUserById, updateProfile };