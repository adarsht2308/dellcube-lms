import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const gifs = [
  "https://media.giphy.com/media/3og0IPxMM0erATueVW/giphy.gif",
  "https://media.giphy.com/media/xT1XGzTj5cJZ5eVbTW/giphy.gif",
  "https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3o6Zt6D93IaaU0vWso/giphy.gif",
  "https://media.giphy.com/media/l3vR85PnGsBwu1PFK/giphy.gif",
];

const Unauthorized = () => {
  const [gifUrl, setGifUrl] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * gifs.length);
    setGifUrl(gifs[randomIndex]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br   p-4">
      <div className="shadow-xl rounded-3xl p-8 sm:p-12 max-w-xl w-full text-center border border-gray-100">
        {gifUrl && (
          <img
            src={gifUrl}
            alt="Funny access denied"
            className="w-auto h-64 mx-auto mb-6 rounded-xl object-cover shadow-md"
          />
        )}
        <h1 className="text-4xl font-extrabold text-red-600 mb-2">
          Access Denied!
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          Oops! Looks like you're trying to access a page you don't have
          permission for.
        </p>

        <Link
          to="/"
          className="inline-block bg-yellow-500 text-white font-semibold px-4 py-2 rounded-xl hover:bg-yellow-600 transition duration-200"
        >
          Take Me Home
        </Link>
      </div>

      <p className="text-sm text-gray-500 mt-6 italic">
        (Don’t worry, your secret is safe with us.)
      </p>
    </div>
  );
};

export default Unauthorized;
