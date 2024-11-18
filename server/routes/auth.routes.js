const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth.middleware");

// JWT Configuration
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
    );
};

const getCookieConfig = (req) => {
    // Check if we're in production (Vercel) environment
    const isProduction = process.env.VERCEL_ENV === "production";

    return {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax", // Important for Vercel
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: "/",
        domain: isProduction ? process.env.VERCEL_URL : "localhost", // Set domain based on environment
    };
};

// Set secure cookie with JWT token
const setTokenCookie = (req, res, token) => {
    const cookieConfig = getCookieConfig(req);
    res.cookie("token", token, cookieConfig);
};

// Register
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ email, password: hashedPassword });
        await user.save();

        const token = generateToken(user);
        setTokenCookie(req, res, token);

        res.status(201).json({ user: user.toSafeObject(), token });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Error creating user" });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user);
        setTokenCookie(req, res, token);

        res.json({ user: user.toSafeObject(), token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});

// Logout
router.post("/logout", (req, res) => {
    res.clearCookie("token", {
        ...getCookieConfig(),
        maxAge: 0,
    });
    res.json({ message: "Logged out successfully" });
});

// Get Current User
router.get("/me", authenticateToken, (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: "Not authenticated" });
    }
});

module.exports = router;
