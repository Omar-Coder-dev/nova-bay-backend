import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith("image/") || allowedTypes.test(file.mimetype);

    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});