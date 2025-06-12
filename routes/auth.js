const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          message: "Validation error",
          errors: errors.array().map((err) => err.msg),
        });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      user = new User({
        name,
        email,
        password,
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user to database
      await user.save();

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          message: "Validation error",
          errors: errors.array().map((err) => err.msg),
        });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Email / Password salah" });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Email / Password salah" });
      }

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Sign the token
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" }, // Token expires in 1 hour
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            message: "Login successful",
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          });
        },
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server error" });
    }
  },
);

module.exports = router;
