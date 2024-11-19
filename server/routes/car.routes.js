const express = require("express");
const router = express.Router();
const Car = require("../models/car.model");
const { authenticateToken } = require("../middleware/auth.middleware");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage, limits: { files: 10 } });

// Create a new car
router.post(
    "/",
    authenticateToken,
    upload.array("images", 10),
    async (req, res) => {
        try {
            const { title, description, tags } = req.body;

            // Parse tags if they are sent as a JSON string
            const parsedTags =
                typeof tags === "string" ? JSON.parse(tags) : tags;

            const images = req.files.map((file) => file.filename);
            const car = new Car({
                title,
                description,
                tags: parsedTags, // Save the parsed tags
                images,
                owner: req.user._id,
            });
            await car.save();
            res.status(201).json(car);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
);

// Get all cars for the logged-in user
router.get("/", authenticateToken, async (req, res) => {
    try {
        const cars = await Car.find({ owner: req.user._id });
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific car
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car || car.owner.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Car not found" });
        }
        res.json(car);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a car
router.put(
    "/:id",
    authenticateToken,
    upload.array("images", 10), // Allow up to 10 images
    async (req, res) => {
        try {
            // Parse JSON strings back to objects
            const tags = req.body.tags ? JSON.parse(req.body.tags) : {};
            const removedImages = req.body.removedImages
                ? JSON.parse(req.body.removedImages)
                : [];

            // Find the car
            const car = await Car.findById(req.params.id);
            if (!car || car.owner.toString() !== req.user._id.toString()) {
                // Clean up any uploaded files if car not found
                if (req.files) {
                    await Promise.all(
                        req.files.map((file) =>
                            fs.unlink(file.path).catch(() => {})
                        )
                    );
                }
                return res.status(404).json({ message: "Car not found" });
            }

            // Update basic fields
            car.title = req.body.title;
            car.description = req.body.description;
            car.tags = tags;

            // Handle image updates
            let updatedImages = [...car.images]; // Start with existing images

            // Remove images that were marked for deletion
            if (removedImages.length > 0) {
                // Remove files from storage
                await Promise.all(
                    removedImages.map((filename) =>
                        fs
                            .unlink(path.join("uploads", filename))
                            .catch(() => {})
                    )
                );

                // Remove from database array
                updatedImages = updatedImages.filter(
                    (img) => !removedImages.includes(img)
                );
            }

            // Add new images
            if (req.files && req.files.length > 0) {
                const newImages = req.files.map((file) => file.filename);
                updatedImages = [...updatedImages, ...newImages];
            }

            // Update car with new image array
            car.images = updatedImages;

            // Validate and save
            const updatedCar = await car.save();
            res.json(updatedCar);
        } catch (err) {
            // Clean up any uploaded files in case of error
            if (req.files) {
                await Promise.all(
                    req.files.map((file) =>
                        fs.unlink(file.path).catch(() => {})
                    )
                );
            }

            if (err.name === "ValidationError") {
                return res.status(400).json({
                    message: "Validation Error",
                    errors: Object.values(err.errors).map((e) => e.message),
                });
            }

            res.status(500).json({
                message: "Error updating car",
                error: err.message,
            });
        }
    }
);

// Delete a car
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        console.log(`Attempting to delete car with ID: ${req.params.id}`);
        console.log(`Authenticated user ID: ${req.user._id}`);

        const car = await Car.findById(req.params.id);
        
        if (!car) {
            console.log(`Car not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: "Car not found" });
        }

        console.log(`Car owner ID: ${car.owner.toString()}`);
        console.log(`Requesting user ID: ${req.user._id.toString()}`);

        if (car.owner.toString() !== req.user._id.toString()) {
            console.log('Owner mismatch - unauthorized deletion attempt');
            return res.status(403).json({ message: "Unauthorized to delete this car" });
        }

        // Delete associated images first
        if (car.images && car.images.length > 0) {
            console.log(`Attempting to delete ${car.images.length} images`);
            try {
                await Promise.all(
                    car.images.map(async (filename) => {
                        const filePath = path.join("uploads", filename);
                        console.log(`Attempting to delete image: ${filePath}`);
                        try {
                            await fs.unlink(filePath);
                            console.log(`Successfully deleted image: ${filePath}`);
                        } catch (unlinkError) {
                            console.error(`Error deleting image ${filePath}:`, unlinkError);
                            // Continue execution even if image deletion fails
                        }
                    })
                );
            } catch (imageError) {
                console.error('Error during image deletion:', imageError);
                // Continue execution even if some images fail to delete
            }
        }

        // Delete the car document
        console.log('Attempting to delete car document from database');
        const deleteResult = await Car.deleteOne({ _id: req.params.id });
        console.log('Delete result:', deleteResult);

        if (deleteResult.deletedCount === 0) {
            console.log('Car document not found in final deletion step');
            return res.status(404).json({ message: "Car not found during deletion" });
        }

        console.log('Car successfully deleted');
        res.json({ message: "Car deleted successfully" });
    } catch (err) {
        console.error('Error in delete car route:', {
            error: err,
            stack: err.stack,
            carId: req.params.id,
            userId: req.user._id
        });

        res.status(500).json({
            message: "Error deleting car",
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

module.exports = router;
