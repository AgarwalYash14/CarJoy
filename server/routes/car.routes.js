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
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { title, description, tags, images } = req.body;
        const car = await Car.findById(req.params.id);
        if (!car || car.owner.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Car not found" });
        }
        car.title = title;
        car.description = description;
        car.tags = tags;
        car.images = images;
        await car.save();
        res.json(car);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a car
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car || car.owner.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: "Car not found" });
        }
        await car.remove();
        res.json({ message: "Car deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
