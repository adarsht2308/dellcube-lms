import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Country } from "./models/country.js";
import { State } from "./models/state.js";
import { City } from "./models/city.js";
import { Locality } from "./models/locality.js";
import { Pincode } from "./models/pincode.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read JSON files
const countries = JSON.parse(fs.readFileSync(path.join(__dirname, "./data/country.json"), "utf8"));
const states = JSON.parse(fs.readFileSync(path.join(__dirname, "./data/state.json"), "utf8"));
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, "./data/cities.json"), "utf8"));
const localities = JSON.parse(fs.readFileSync(path.join(__dirname, "./data/localities.json"), "utf8"));
const pincodes = JSON.parse(fs.readFileSync(path.join(__dirname, "./data/pincodes.json"), "utf8"));

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Database Connected");

    // Clear existing data
    await Country.deleteMany({});
    await State.deleteMany({});
    await City.deleteMany({});
    await Locality.deleteMany({});
    await Pincode.deleteMany({});

    // Insert countries
    const countryPayload = countries.map(c => ({
      name: c.name,
      code: c.iso2,
      status: true,
    }));

    const countryDocs = await Country.insertMany(countryPayload);
    const countryMap = {};
    countryDocs.forEach(c => { countryMap[c.code] = c._id; });

    // Insert states
    const stateDocs = await State.insertMany(
      states.map(s => ({
        name: s.name,
        country: countryMap[s.country_code],
        status: true
      }))
    );
    const stateMap = {};
    stateDocs.forEach(s => { stateMap[s.name] = s._id; });

    // Insert cities
    const cityDocs = await City.insertMany(
      cities.map(c => ({
        name: c.name,
        state: stateMap[c.state_name]
      }))
    );
    // Create cityMap for lookup
    const cityMap = {};
    cityDocs.forEach(c => {
      cityMap[c.name.trim().toLowerCase()] = c._id;
    });

    // Insert Localities
    const localityMap = {};
    const localityPayload = [];

    localities.forEach(loc => {
      const cityName = loc.City?.trim().toLowerCase();
      const localityName = loc.Area?.trim();

      if (cityName && localityName && cityMap[cityName]) {
        const key = `${localityName}-${cityMap[cityName]}`;
        if (!localityMap[key]) {
          localityPayload.push({
            name: localityName,
            city: cityMap[cityName],
            status: true,
          });
          localityMap[key] = null; // temp, to update with _id later
        }
      }
    });

    const localityDocs = await Locality.insertMany(localityPayload);

    // Populate localityMap with _ids
    localityDocs.forEach(l => {
      const key = `${l.name}-${l.city.toString()}`;
      localityMap[key] = l._id;
    });

    // Insert Pincodes
    const pincodePayload = [];

    localities.forEach(loc => {
      const cityName = loc.City?.trim().toLowerCase();
      const localityName = loc.Area?.trim();
      const pincode = loc.Pincode?.toString();

      const cityId = cityMap[cityName];
      const key = `${localityName}-${cityId}`;

      if (localityMap[key] && pincode) {
        pincodePayload.push({
          code: pincode,
          locality: localityMap[key],
          status: true,
        });
      }
    });

    await Pincode.insertMany(pincodePayload);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();