import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";
import sendEmail from "../utils/sendEmail";
import otpEmailTemplate from "../utils/emailTemplates/otpEmail";
import googleClient from "../config/googleAuth";
import { AuthProvider } from "../constants/enums";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id.toString());

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  return res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Generic response whether or not the user exists - same reasoning as login,
    // don't let attackers figure out which emails are registered
    if (!user) {
      return res.status(200).json({ message: "If that email exists, an OTP has been sent" });
    }

    // generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // hash it before saving - never store the raw OTP, same principle as passwords
    const hashedOTP = await bcrypt.hash(otp, 10);

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 minutes

    await user.save();

    // send the PLAIN otp to the user's email - the hash is only for what we store
    await sendEmail({
      to: user.email,
      subject: "Your Password Reset OTP",
      html: otpEmailTemplate(otp),
    });

    return res.status(200).json({ message: "If that email exists, an OTP has been sent" });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    // need to explicitly select these since they're select:false by default
    const user = await User.findOne({ email }).select("+resetPasswordOTP +resetPasswordExpires");

    if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // check expiry first - cheap check, avoids unnecessary bcrypt work if already expired
    if (user.resetPasswordExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // set the new password - the pre('save') hook will hash it automatically
    user.password = newPassword;

    // clear the OTP fields so they can't be reused
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};


export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        authProvider: AuthProvider.google,
        googleId,
      });
    } else if (user.authProvider !== AuthProvider.google) {
      user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    next(err);
  }
};