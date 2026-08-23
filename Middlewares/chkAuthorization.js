export function allowedRoles(...roles) {
    return function (req, res, next) {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (roles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: `Access denied: Authorized roles required (${roles.join(", ")})`
            });
        }
    };
}