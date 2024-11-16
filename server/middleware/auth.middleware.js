const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");

const authenticateToken = async (req, res, next) => {
    try {
        let token = req.cookies.token;

        // Check Authorization header if no cookie token
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res
                .status(401)
                .json({ message: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res
                .status(401)
                .json({ message: "User not found or deactivated" });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = { authenticateToken };
