import jwt from "jsonwebtoken";

export const generateToken = (res, user, message) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.SECRETKEY,
    {
      expiresIn: "1d",
    }
  );

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      // httpOnly: false,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
      secure:true
      // secure: false
    })
    .json({
      success: true,
      message,
      user,
      token,
    });
};
