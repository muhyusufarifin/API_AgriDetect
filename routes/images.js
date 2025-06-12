const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const Image = require('../models/Image');
const path = require('path');
const fs = require('fs'); // To delete files if needed

// --- Multer configuration for image storage ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure the directory exists
    const dir = 'uploads/images/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir); // Store images in uploads/images folder
  },
  filename: function (req, file, cb) {
    // Create unique filename: fieldname-timestamp.ext
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

// File filter to ensure only image files are uploaded
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

// @route   POST /api/images/upload
// @desc    Upload an image for the authenticated user
// @access  Private (requires token)
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Create a new entry in the database for the uploaded image
    const newImage = new Image({
      user_id: req.user.id,
      filename: req.file.filename,
      filepath: req.file.path, // Store the full path of the file
    });

    await newImage.save();

    res.status(201).json({
      message: 'Image uploaded successfully',
      filename: req.file.filename,
      imageUrl: `http://localhost:${process.env.PORT || 3000}/uploads/images/${req.file.filename}`
    });
  } catch (err) {
    console.error('Error during image upload:', err.message);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/images
// @desc    Get all images uploaded by the authenticated user
// @access  Private (requires token)
router.get('/', auth, async (req, res) => {
  try {
    // Find all images associated with the user_id from the token
    const images = await Image.find({ user_id: req.user.id }).select('-__v');

    // Format the response to include the full image URL
    const formattedImages = images.map(img => ({
      id: img._id,
      user_id: img.user_id,
      filename: img.filename,
      uploaded_at: img.uploaded_at,
      imageUrl: `http://localhost:${process.env.PORT || 3000}/uploads/images/${img.filename}`
    }));

    res.status(200).json({
      message: 'Images retrieved successfully',
      images: formattedImages,
    });
  } catch (err) {
    console.error('Error retrieving images:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;