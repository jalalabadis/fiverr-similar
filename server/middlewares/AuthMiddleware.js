import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
  const token = await req.cookies.jwt;
  const jwtString = token.substring(8, token.length - 2);

  if (!token) return res.status(401).send("You are not authenticated!");
  jwt.verify(jwtString, process.env.JWT_KEY, async (err, payload) => {
    if (err) return res.status(403).send("Token is not valid!");
    req.userId = payload?.userId;
    next();
  });
};
