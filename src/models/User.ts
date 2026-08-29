import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole, AuthProvider } from "../constants/enums";

// This describes what a user looks like in our code.
// "extends Document" just means it also gets the normal Mongoose stuff, like an ID.
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // the "?" means this can be missing - Google users won't have one
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string; // only exists if the user signed up with Google
  wishlist: mongoose.Types.ObjectId[]; // list of product IDs this user has saved
  address?: string; // optional saved shipping address, editable on the profile page
  resetPasswordOTP?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // removes extra spaces at the start/end
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // no two users can have the same email
      lowercase: true, // turns "A@B.com" into "a@b.com" automatically
      trim: true,
    },
    password: {
      type: String,
      select: false, // hides this field by default - we only ask for it explicitly, like during login
    },
    role: {
      type: String,
      enum: Object.values(UserRole), // only allows "user" or "admin"
      default: UserRole.user,
    },
    authProvider: {
      type: String,
      enum: Object.values(AuthProvider), // only allows "local" or "google"
      default: AuthProvider.local,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // lets many users have no googleId at all without triggering a duplicate error
    },
    wishlist: [
      {
        type: Schema.Types.ObjectId, // just stores the product's ID, not the full product
        ref: "Product", // tells Mongoose which collection this ID points to
      },
    ],
    address: {
      type: String,
      trim: true,
      // no "required" - not every user will have set one yet
    },
    resetPasswordOTP: {
      type: String,
      select: false, // same reasoning as password - never returned by default
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true }, // automatically adds "createdAt" and "updatedAt" dates
);
// Runs automatically right before a user gets saved to the database.
// Makes sure the password is never stored as plain text.
userSchema.pre("save", async function (next) {
  // if there's no password (Google users) or it wasn't changed, skip hashing
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
// Turns the schema into something we can actually use to talk to MongoDB.
// This also creates the "users" collection in the database.
const User = mongoose.model<IUser>("User", userSchema);

export default User;
