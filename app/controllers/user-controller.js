const User = require("../models/users-model");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const _ = require("lodash");
const sendEmail = require("../utilities/node-mailer/email");
const getEmailTemplate = require("../utilities/node-mailer/email-template");
const { validationResult } = require("express-validator");
const generateOtp = () => {
  const otp = Math.round(Math.random() * 10000);
  console.log(otp);
  return otp;
};
const usersCntrl = {};
usersCntrl.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const body = req.body;
  const otp1 = generateOtp();
  try {
    const user = new User(body);
    const salt = await bcryptjs.genSalt();
    const encryptedPassword = await bcryptjs.hash(user.password, salt);
    user.password = encryptedPassword;
    // const adminCount=await User.findOne({role:"admin"})
    // console.log(adminCount)
    // if(adminCount ){
    //     return res.status(401).json({error:"admin cannot be more than one"})
    // }

    user.otp = otp1;
    await user.save();

    // Send Verify Email
    const emailContent = `
      <p>Welcome to PickParking! We are excited to have you on board.</p>
      <p>Please use the OTP below to verify your email address and complete your registration:</p>
      <div class="otp-box">${user.otp}</div>
      <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Welcome to PickParking - Verify Your Email",
      html: getEmailTemplate("Verify Your Email Address", emailContent),
      text: `Welcome to PickParking! Your verification OTP is: ${user.otp}`
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: "internal server error" });
  }
};
usersCntrl.verifyEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(401).json({ errors: errors.array() });
  }
  const { email, otp } = req.body;
  console.log(email, otp, "verify");
  try {
    const user = await User.findOneAndUpdate(
      { email: email, otp: otp },
      { $set: { isverified: true } },
      { new: true }
    );
    if (!user) {
      return res.status(401).json("email and otp is not currect");
    }
    res.status(201).json("email verified");
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
usersCntrl.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(402).json({ errors: errors.array() });
  }
  const body = req.body;
  try {
    const user = await User.findOne({ email: body.email });
    if (!user) {
      return res.status(404).json({ error: "email or password wrong" });
    }
    const password = await bcryptjs.compare(body.password, user.password);
    if (!password) {
      return res.status(401).json({ error: "email or password is wrong" });
    }
    if (!user.isverified) {
      console.log(user, "user");

      const emailContent = `
        <p>It looks like you haven't verified your email address yet.</p>
        <p>Please use the OTP below to verify your account:</p>
        <div class="otp-box">${user.otp}</div>
        <p>If you didn't request this, please ignore this email.</p>
      `;

      await sendEmail({
        email: user.email,
        subject: "Action Required: Verify Your PickParking Email",
        html: getEmailTemplate("Pending Email Verification", emailContent),
        text: `Please verify your email. Your OTP is: ${user.otp}`
      });

      return res
        .status(403)
        .json({ error: "User is not verified", email: user.email });
    }
    const tokenData = {
      id: user._id,
      role: user.role,
    };
    const token = jwt.sign(tokenData, process.env.SECRET_JWT, {
      expiresIn: "12d",
    });
    res.status(200).json({ token: token, id: user._id, role: user.role });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "internal server error" });
  }
};
//my account
usersCntrl.my = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ error: "internal server error" });
  }
};
//updating password
usersCntrl.updatePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors.array() });
  }
  const id = req.user.id;
  const data = _.pick(req.body, [
    "oldPassword",
    "newPassword",
    "changePassword",
  ]);
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(401).json({ error: "user not found" });
    }
    const result = await bcryptjs.compare(data.oldPassword, user.password);
    if (!result) {
      return res
        .status(401)
        .json({ error: "your old password is not matching" });
    }
    if (data.newPassword == data.changePassword) {
      const salt = await bcryptjs.genSalt();
      const hashPassword = await bcryptjs.hash(data.newPassword, salt);
      const response = await User.findOneAndUpdate(
        { _id: req.user.id },
        { password: hashPassword },
        { new: true }
      );
      return res.status(200).json(response);
    } else {
      return res.status(401).json({ error: " new password are not matching" });
    }
  } catch (err) {
    console.log(err);
  }
};
usersCntrl.accounts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select({ password: 0 });
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ error: "internal server error" });
  }
};
usersCntrl.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(402).json({ errors: errors.array() });
  }
  const { email } = _.pick(req.body, ["email"]);
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ error: "email not found" });
    }
    const otp = generateOtp();
    const response = await User.findOneAndUpdate(
      { email: email },
      { otp: otp },
      { new: true }
    );

    const emailContent = `
      <p>We received a request to reset your password for your PickParking account.</p>
      <p>Please use the OTP below to proceed with resetting your password:</p>
      <div class="otp-box">${otp}</div>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "PickParking - Password Reset Request",
      html: getEmailTemplate("Reset Your Password", emailContent),
      text: `Your password reset OTP is: ${otp}`
    });
    res.status(201).json({ status: "success", msg: "sent success " });
  } catch (err) {
    console.log(err);
  }
};
//set forgotpassword
usersCntrl.setFogotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(402).json({ errors: errors.array() });
  }
  const { email, otp, password } = _.pick(req.body, ["email", "password"]);
  try {
    const salt = await bcryptjs.genSalt();
    const hashPassword = await bcryptjs.hash(password, salt);
    const user = await User.findOneAndUpdate(
      { email: email },
      { password: hashPassword },
      { new: true }
    );
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
    res.status(501).json({ error: "internal server error" });
  }
};
usersCntrl.remove = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findOneAndDelete({ _id: id });
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ error: "internal server errro" });
  }
};
usersCntrl.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email: email, otp: otp },
      { $set: { isverified: true } },
      { new: true }
    );
    if (!user) {
      return res.status(401).json({ error: "email and otp is not currect" });
    }
    res.status(201).json("email verified");
  } catch (err) {
    console.error("Error verifying email:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
usersCntrl.verifyOtp = async (req, res) => {
  const { email, otp } = req.query;
  try {
    const user = await User.findOne({ email: email, otp: otp });
    if (!user) {
      return res.status(401).json({ error: "email and otp is not currect" });
    }
    res.status(200).json("OTP  verified");
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
usersCntrl.listCustomer = async (req, res) => {
  const adminId = req.user.id;
  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: "admin not found" });
    }
    const customer = await User.find({ role: "customer" });
    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
};
usersCntrl.listOwner = async (req, res) => {
  const adminId = req.user.id;
  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ error: "admin not found" });
    }
    const owner = await User.find({ role: "owner" });
    res.status(200).json(owner);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
};
//find owners based on query
usersCntrl.findOwners = async (req, res) => {
  const search = req.query.search || "";
  try {
    const owners = await User.find({ name: { $regex: search, $options: "i" } });
    res.status(202).json(owners);
  } catch (err) {
    res.status(500).json({ error: "internal server error" });
  }
};
module.exports = usersCntrl;
