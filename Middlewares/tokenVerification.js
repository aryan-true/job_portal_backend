import jwt from "jsonwebtoken"

export function verifyToken(req, res, next) {
    let token = req.cookies?.AccessToken || req.cookies?.accessToken

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "You must login to continue"
        })
    }

    try {
        let decodedToken = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decodedToken
        next()
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Please relogin to continue"
        })
    }
}