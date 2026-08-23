import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  let accessToken = req.cookies.AccessToken || req.cookies.accessToken;
  if (accessToken === undefined) {
    res.status(401).json({ success: false, message: "You must login to continue" });
  } else {
    try {
      let decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
      req.user = decodedToken;
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: "Please relogin to continue" });
    }
  }
}