import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getUsers,
  getUserById,
  updateProfile,
} from "../controllers/userController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUserById);
router.put("/profile", authMiddleware, updateProfile);

router.post("/upload", authMiddleware, (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      console.log("MULTER/CLOUDINARY ERROR:", err);
      return res.status(500).json({
        message: "Upload failed",
        error: err.message || err,
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    return res.status(200).json({
      secure_url: req.file.path,
    });
  });
});

export default router;