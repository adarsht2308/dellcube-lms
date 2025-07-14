import fs from "fs";
import path from "path";

export const deleteFile = (relativeFilePath) => {
  try {
    const absolutePath = path.join(process.cwd(), relativeFilePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    } else {
      console.log("File not found:", absolutePath);
    }
  } catch (error) {
    console.error(`Error deleting file at ${relativeFilePath}:`, error.message);
  }
};
