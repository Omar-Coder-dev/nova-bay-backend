import { Router } from "express";
import { 
  createProduct, 
  deleteProduct, 
  getProductById, 
  getProducts, 
  getRelatedProducts, 
  updateProduct,
  uploadProductImage 
} from "../controllers/productController";
import { protect, restrictTo } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

router.get("/", getProducts);
router.post("/upload-image", protect, restrictTo("admin"), upload.single("image"), uploadProductImage);
router.get("/:id", getProductById);
router.post("/", protect, restrictTo("admin"), createProduct);
router.patch("/:id", protect, restrictTo("admin"), updateProduct);
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);
router.get("/:id/related", getRelatedProducts);
export default router;