import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
    let token = req.cookies?.AccessToken || req.cookies?.accessToken;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required: Please login to continue"
        });
    }

    try {
        const secret = process.env.JWT_SECRET || "job-seeker-project-1";
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session token. Please login again."
        });
    }
}