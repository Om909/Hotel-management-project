import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export default function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 🔒 Check header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing",
      });
    }

    // 🔑 Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token not found",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔐 Role check
    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Access denied (admin only)",
      });
    }

    // Attach admin info
    req.admin = decoded;

    next();
  } catch (err) {
    console.error("Auth Error:", err.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}