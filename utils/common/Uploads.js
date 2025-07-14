import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageFields = [
  "profilePhoto",
  "bannerImage",
  "customerProfilePhoto",
  "fabricImage",
  "styleImage",
  "companyLogo",
  "orderPhoto",
  "signature",
  "receiverSignature",
  // Vehicle certificate images
  "fitnessCertificateImage",
  "pollutionCertificateImage",
  "registrationCertificateImage",
  "insuranceImage",
];

const videoFields = ["videoUpload"];

// Multer Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype.startsWith("video/");
    let folder = "uploads";

    if (imageFields.includes(file.fieldname)) folder += "/images";
    else if (videoFields.includes(file.fieldname)) folder += "/videos";

    return {
      folder,
      resource_type: isVideo ? "video" : "image",
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only images and videos are allowed."),
        false
      );
    }
  },
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "bannerImage", maxCount: 1 },
  { name: "customerProfilePhoto", maxCount: 1 },
  { name: "fabricImage", maxCount: 1 },
  { name: "styleImage", maxCount: 1 },
  { name: "companyLogo", maxCount: 1 },
  { name: "orderPhoto", maxCount: 1 },
  { name: "videoUpload", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "receiverSignature", maxCount: 1 },
  // Vehicle certificate images
  { name: "fitnessCertificateImage", maxCount: 1 },
  { name: "pollutionCertificateImage", maxCount: 1 },
  { name: "registrationCertificateImage", maxCount: 1 },
  { name: "insuranceImage", maxCount: 1 },
]);

export default upload;
