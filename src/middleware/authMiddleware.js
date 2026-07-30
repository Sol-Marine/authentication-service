import jwt from "jsonwebtoken";

export async function authMiddleware(c, next) {

  const authorization =
    c.req.header("Authorization");

  if (!authorization) {

    return c.json(
      {
        success: false,
        message: "Authorization header is required.",
      },
      401
    );

  }

  if (!authorization.startsWith("Bearer ")) {

    return c.json(
      {
        success: false,
        message: "Invalid authorization format.",
      },
      401
    );

  }

  const token = authorization.split(" ")[1];

  let decoded;

  try {

    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

  } catch (error) {

    return c.json(
      {
        success: false,
        message: "Invalid or expired access token.",
      },
      401
    );

  }

  c.set("user", decoded);

  await next();

}