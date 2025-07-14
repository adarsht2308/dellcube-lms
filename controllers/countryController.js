  import { Country } from "../models/country.js";

  export const createCountry = async (req, res) => {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({ message: "Name and code are required" });
      }

      const existing = await Country.findOne({
        $or: [{ name }, { code }],
      });

      if (existing) {
        return res.status(400).json({ message: "Country already exists" });
      }

      const country = new Country({ name, code });
      await country.save();

      res.status(201).json({
        success: true,
        message: "Country created successfully",
        country,
      });
    } catch (err) {
      console.error("Error creating country:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

  export const getAllCountries = async (req, res) => {
    try {
      let { page, limit, search } = req.query;
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      const skip = (page - 1) * limit;

      const query = {};
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }

      const countries = await Country.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Country.countDocuments(query);

      return res.status(200).json({
        success: true,
        message: "Countries fetched successfully",
        countries,
        page,
        limit,
        total,
        currentPageCount: countries.length,
        totalPage: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching countries:", error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong while fetching countries",
      });
    }
  };

  export const getCountryById = async (req, res) => {
    try {
      const { id } = req.body;

      const country = await Country.findById(id);
      if (!country) {
        return res
          .status(404)
          .json({ success: false, message: "Country not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Country fetched successfully",
        country,
      });
    } catch (error) {
      console.error("Error fetching country:", error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong while fetching the country",
      });
    }
  };

  export const updateCountry = async (req, res) => {
    try {
      const { countryId, name, code, status } = req.body;

      const country = await Country.findById(countryId);
      if (!country) {
        return res
          .status(404)
          .json({ success: false, message: "Country not found" });
      }

      if (name) country.name = name;
      if (code) country.code = code;
      if (status !== undefined) country.status = status;

      await country.save();

      return res.status(200).json({
        success: true,
        message: "Country updated successfully",
        country,
      });
    } catch (error) {
      console.error("Error updating country:", error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong while updating the country",
      });
    }
  };

  export const deleteCountry = async (req, res) => {
    try {
      const { id } = req.body;

      const country = await Country.findById(id);
      if (!country) {
        return res
          .status(404)
          .json({ success: false, message: "Country not found" });
      }

      await country.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Country deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting country:", error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong while deleting the country",
      });
    }
  };
