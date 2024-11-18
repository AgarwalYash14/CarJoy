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

const getCookieConfig = () => {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: false,
        secure: isProduction, // Only set to true in production
        sameSite: isProduction ? "none" : "lax", // Use 'none' for cross-site cookies in production
        domain: isProduction ? ".vercel.app" : "localhost", // Adjust domain based on environment
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
};

// Set secure cookie with JWT token
const setTokenCookie = (res, token) => {
    res.cookie("token", token, getCookieConfig());
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
        setTokenCookie(res, token);

        res.status(201).json({ user: user.toSafeObject() });
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
        setTokenCookie(res, token);

        res.json({ user: user.toSafeObject() });
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
