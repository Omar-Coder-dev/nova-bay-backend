import mongoose, { Document, Schema } from 'mongoose';
import { ProductCategory } from '../constants/enums';

// Describes what a product looks like in our code.
export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  stock: number;
  imageUrl: string;
  averageRating: number; // calculated from reviews, not set manually
  numReviews: number; // calculated from reviews, not set manually
  isActive: boolean; // lets us "hide" a product without deleting it (protects order history)
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'], // stops accidental negative prices
    },
    category: {
      type: String,
      enum: Object.values(ProductCategory), // only allows values from our category list
      required: [true, 'Category is required'],
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Stock cannot be negative'], // stops stock from going below zero
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    averageRating: {
      type: Number,
      default: 0, // starts at 0, gets recalculated whenever a review is added/removed
    },
    numReviews: {
      type: Number,
      default: 0, // starts at 0, gets recalculated whenever a review is added/removed
    },
    isActive: {
      type: Boolean,
      default: true, // deleting a product would break past orders that reference it,
      // so "deleting" in the admin panel should really just flip this to false
    },
  },
  { timestamps: true }
);

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;