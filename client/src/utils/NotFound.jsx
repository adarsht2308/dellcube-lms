import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const gifs = [
  "https://media.giphy.com/media/UoeaPqYrimha6rdTFV/giphy.gif",
  "https://media.giphy.com/media/14uQ3cOFteDaU/giphy.gif",
  "https://media.giphy.com/media/3o6ZsYeZbW7u8Jgymo/giphy.gif",
  "https://media.giphy.com/media/hEc4k5pN17GZq/giphy.gif",
  "https://media.giphy.com/media/fAnEC88LccN7a/giphy.gif",
  "https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif",
];

const NotFound = () => {
  const [gifUrl, setGifUrl] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * gifs.length);
    setGifUrl(gifs[randomIndex]);
  }, []);

  return (
    <div className="min-h-[95vh] flex flex-col justify-center items-center bg-gradient-to-br md:mt-24   p-4">
      <div className=" shadow-xl rounded-3xl p-8 sm:p-12 max-w-xl w-full text-center border border-gray-100">
        {gifUrl && (
          <img
            src={gifUrl}
            alt="404 gif"
            className="w-auto h-64 mx-auto mb-6 rounded-xl object-cover shadow-md"
          />
        )}
        <h1 className="text-5xl font-extrabold text-red-600 mb-2">404</h1>
        <p className="text-gray-700 text-lg mb-6">
          Uh-oh! The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block bg-yellow-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-yellow-700 transition duration-200"
        >
          Back to Home
        </Link>
      </div>
      <p className="text-sm text-gray-500 mt-6 italic">
        Or maybe the page went on vacation... 🏖️
      </p>
    </div>
  );
};

export default NotFound;
