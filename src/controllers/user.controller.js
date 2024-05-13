import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
const registerUser = asyncHandler(async (req, res) => {
  // get user details from user(frontend)
  const { fullName, userName, email, password } = req.body;
  console.log(fullName, userName);
  // validation -  not empty
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // check if user already exists: username,email
  const isUserExists = User.findOne({
    $or: [{ email }, { userName }],
  });
  console.log(isUserExists);
  if (isUserExists) {
    throw new ApiError(409, "User with username or email exits");
  }
  // check for images,avatar

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  // upload to cloudinary
  const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
  if (coverImageLocalPath) {
    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
  }
  if (!avatarResponse) {
    throw new ApiError(400, "Avatar file is required");
  }
  // create user object - create entry in db

  const user = await User.create({
    username: userName,
    fullName,
    email,
    avatar: avatarResponse.url,
    coverImage: coverImageResponse?.url || "",
  });
  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  // return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created"));
});

export { registerUser };
