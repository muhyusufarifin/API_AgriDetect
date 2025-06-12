const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const Disease = require("../models/Disease"); // Pastikan ini diimpor
const AnalysisResult = require("../models/AnalysisResult");
const path = require("path");
const fs = require("fs");
const fsPromises = require('fs').promises;

const tf = require("@tensorflow/tfjs-node");
const sharp = require("sharp");

let model;
const classNames = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
];

async function loadTfjsModel() {
    try {
        model = await tf.loadGraphModel(
            `file://${path.join(__dirname, "..", "model", "model.json")}`,
        );
        console.log(
            "TensorFlow.js Model loaded successfully in Node.js backend!",
        );
    } catch (error) {
        console.error(
            "Failed to load TensorFlow.js model in Node.js backend:",
            error,
        );
        process.exit(1);
    }
}
loadTfjsModel();

const storageAnalysis = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "uploads/analysis/";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, "analysis-" + Date.now() + path.extname(file.originalname));
    },
});

const uploadAnalysis = multer({ storage: storageAnalysis });

router.post(
    "/analyze",
    auth,
    uploadAnalysis.single("image"),
    async (req, res) => {
        let imagePath = "";
        let formattedImageBuffer = null;
        const originalImageFilename = req.file.originalname;

        try {
            if (!req.file) {
                return res
                    .status(400)
                    .json({ message: "No image file uploaded for analysis" });
            }
            if (!model) {
                return res.status(503).json({
                    message:
                        "ML model is not loaded yet. Please try again in a moment.",
                });
            }

            imagePath = req.file.path;

            console.log(
                `Processing image: ${imagePath} for user: ${req.user.id}`,
            );
            console.log(`Checking if file exists at: ${imagePath}`);
            if (!fs.existsSync(imagePath)) {
                console.error(
                    `File does not exist at path: ${imagePath} immediately after upload.`,
                );
                return res.status(500).json({
                    message:
                        "Internal Server Error: Uploaded file not found on disk.",
                });
            }
            console.log(`File size: ${fs.statSync(imagePath).size} bytes`);

            let mlPredictionResult = {};
            let tensorProcessedImageBuffer = null;
            try {
                console.log(
                    `Attempting to read and resize image with Sharp from: ${imagePath}`,
                );
                tensorProcessedImageBuffer = await sharp(imagePath)
                    .resize(128, 128)
                    .removeAlpha()
                    .toColorspace("srgb")
                    .raw()
                    .toBuffer();

                console.log(
                    "Sharp successfully processed the image for ML. Converting to tensor.",
                );

                const expectedBufferSize = 128 * 128 * 3;
                if (tensorProcessedImageBuffer.length !== expectedBufferSize) {
                    console.error(
                        `ERROR: Expected RAW buffer length ${expectedBufferSize}, but got ${tensorProcessedImageBuffer.length}. This indicates a mismatch in color channels or dimensions.`,
                    );
                    throw new Error(
                        `Mismatched pixel data size after Sharp processing. Expected ${expectedBufferSize}, got ${tensorProcessedImageBuffer.length}.`,
                    );
                }

                const tensor = tf
                    .tensor3d(
                        Array.from(tensorProcessedImageBuffer),
                        [128, 128, 3],
                    )
                    .toFloat()
                    .div(255.0)
                    .expandDims();

                const prediction = model.predict(tensor);
                const predictionData = await prediction.data();

                const maxIndex = predictionData.indexOf(
                    Math.max(...predictionData),
                );
                const detectedClassName = classNames[maxIndex];
                const confidence = (Math.max(...predictionData) * 100).toFixed(
                    2,
                );

                const parts = detectedClassName.split("___");
                const plantName = parts[0];
                const diseaseName = parts[1] || "healthy"; // Default ke 'healthy' jika tidak ada bagian penyakit

                mlPredictionResult = {
                    plantName: plantName,
                    diseaseName: diseaseName,
                    confidence: confidence,
                };
                console.log("ML prediction:", mlPredictionResult);

                tensor.dispose();
                prediction.dispose();

                formattedImageBuffer = await sharp(imagePath)
                    .resize(128, 128)
                    .jpeg({ quality: 80 })
                    .toBuffer();
                console.log("Image re-processed by Sharp for permanent storage (JPEG).");

            } catch (mlError) {
                console.error(
                    "Error during ML inference (Sharp/TensorFlow.js):",
                    mlError,
                );
                console.error("Details:", mlError.message);
                return res.status(500).json({
                    message: "Error performing ML analysis",
                    details: mlError.message,
                });
            } finally {
                if (fs.existsSync(imagePath)) {
                    fs.unlink(imagePath, (err) => {
                        if (err)
                            console.error(
                                "Error deleting temporary analysis image:",
                                err,
                            );
                    });
                }
            }

            const permanentUploadDir = "uploads/processed_images/";
            if (!fs.existsSync(permanentUploadDir)) {
                fs.mkdirSync(permanentUploadDir, { recursive: true });
            }
            const permanentImageName = `processed-${Date.now()}.jpeg`;
            const permanentImagePath = path.join(
                permanentUploadDir,
                permanentImageName,
            );

            try {
                if (formattedImageBuffer) {
                    await fsPromises.writeFile(
                        permanentImagePath,
                        formattedImageBuffer,
                    );
                    console.log(
                        `Image copied to permanent storage: ${permanentImagePath}`,
                    );
                } else {
                    console.error(
                        "ERROR: No formatted image buffer available for permanent storage. This should not happen if ML processing succeeded.",
                    );
                    return res.status(500).json({ message: 'Failed to save processed image due to missing formatted buffer.' });
                }
            } catch (copyError) {
                console.error(
                    "Error copying image to permanent storage:",
                    copyError.message,
                );
                return res.status(500).json({ message: `Failed to save processed image: ${copyError.message}` });
            }
            const permanentImageUrl = `${req.protocol}://${req.get("host")}/uploads/processed_images/${permanentImageName}`;

            let diseaseDetailsFromDB = null;
            const finalDiseasesOutput = [];

            // --- PERUBAHAN UTAMA DIMULAI DI SINI ---
            // Selalu coba cari disease_name (termasuk 'healthy') berdasarkan plant_name dari database
            diseaseDetailsFromDB = await Disease.findOne({
                plant_name: mlPredictionResult.plantName,
                disease_name: mlPredictionResult.diseaseName,
            });

            if (diseaseDetailsFromDB) {
                // Jika ditemukan di database (baik itu penyakit atau status 'healthy')
                finalDiseasesOutput.push({
                    disease_name: diseaseDetailsFromDB.disease_name,
                    description: diseaseDetailsFromDB.description,
                    solution: diseaseDetailsFromDB.solution,
                });
            } else {
                // Fallback jika tidak ditemukan di database (misalnya, nama penyakit yang tidak dikenal
                // atau kombinasi plant_name dan disease_name yang tidak ada di database)
                console.warn(
                    `Disease "${mlPredictionResult.diseaseName}" for plant "${mlPredictionResult.plantName}" not found in local database. Using placeholder.`,
                );
                finalDiseasesOutput.push({
                    disease_name:
                        mlPredictionResult.diseaseName || "Unknown Disease",
                    description:
                        "Deskripsi untuk penyakit ini belum tersedia. Mungkin ini penyakit langka atau varian baru.",
                    solution:
                        "Solusi tidak tersedia. Harap konsultasikan dengan ahli pertanian atau spesialis untuk diagnosis dan penanganan yang akurat.",
                });
            }
            // --- PERUBAHAN UTAMA BERAKHIR DI SINI ---

            const newAnalysisResult = new AnalysisResult({
                user_id: req.user.id,
                image_filename: permanentImageName,
                image_url: permanentImageUrl,
                plant_name_detected: mlPredictionResult.plantName,
                diseases_detected: finalDiseasesOutput,
                confidence: mlPredictionResult.confidence,
            });

            await newAnalysisResult.save();
            console.log("Analysis result saved to database.");

            res.status(200).json({
                message: "Image analyzed and result saved successfully",
                plantName: mlPredictionResult.plantName,
                diseases: finalDiseasesOutput,
                confidence: mlPredictionResult.confidence,
                analysisId: newAnalysisResult._id,
                imageUrl: permanentImageUrl,
            });
        } catch (err) {
            console.error("Error during disease analysis API:", err.message);
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: err.message });
            }
            res.status(500).json({ message: "Server error" });
        }
    },
);

router.get("/analysis_history", auth, async (req, res) => {
    try {
        const analysisHistory = await AnalysisResult.find({
            user_id: req.user.id,
        })
            .select("-__v -updatedAt")
            .sort({ analysis_date: -1 });

        const REPLIT_BASE_URL = process.env.REPLIT_APP_URL || `${req.protocol}://${req.get("host")}`;

        const formattedHistory = analysisHistory.map(result => {
            let imageUrl = result.image_url;

            if (imageUrl && typeof imageUrl === 'string') {
                if (imageUrl.includes('localhost') || imageUrl.includes('0.0.0.0')) {
                    imageUrl = `${REPLIT_BASE_URL}/uploads/processed_images/${result.image_filename}`;
                }
            } else {
                if (result.image_filename) {
                    imageUrl = `${REPLIT_BASE_URL}/uploads/processed_images/${result.image_filename}`;
                } else {
                    console.warn(`Analysis result ${result._id} is missing both image_url and image_filename. Using generic placeholder.`);
                    imageUrl = `${REPLIT_BASE_URL}/placeholder.jpeg`;
                }
            }

            let confidence = result.confidence;
            if (confidence === undefined || confidence === null) {
                console.warn(`Analysis result ${result._id} is missing confidence. Setting to N/A.`);
                confidence = "N/A";
            }

            return {
                _id: result._id,
                user_id: result.user_id,
                image_filename: result.image_filename,
                imageUrl: imageUrl,
                plant_name_detected: result.plant_name_detected,
                diseases_detected: result.diseases_detected,
                confidence: confidence,
                analysis_date: result.analysis_date,
            };
        });

        res.status(200).json({
            message: "Analysis history retrieved successfully",
            history: formattedHistory,
        });
    } catch (err) {
        console.error("Error retrieving analysis history:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;