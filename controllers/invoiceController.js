import { Invoice } from "../models/invoice.js";
import mongoose from "mongoose";
import { Company } from "../models/company.js";
import { Branch } from "../models/branch.js";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { Vendor } from "../models/vendor.js";
import { Parser as Json2CsvParser } from 'json2csv';
import { fileURLToPath } from 'url';

export const createInvoice = async (req, res) => {
  try {
    const user = req.user;

    let companyId = req.body.company;
    let branchId = req.body.branch;

    // Role-based control
    if (user.role === "branchAdmin" || user.role === "operation") {
      companyId = user.company;
      branchId = user.branch;
    }

    if (!companyId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Company and Branch information is required.",
      });
    }

    // Fetch company and branch documents
    const companyDoc = await mongoose
      .model("Company")
      .findById(companyId)
      .select("name");
    const branchDoc = await mongoose
      .model("Branch")
      .findById(branchId)
      .select("name");

    if (!companyDoc || !branchDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid company or branch selected",
      });
    }

    // Generate companyCode and branchCode
    const companyCode = companyDoc.name
      ?.toUpperCase()
      .slice(0, 3)
      .replace(/\s/g, "");
    const branchCode = branchDoc.name
      ?.toUpperCase()
      .slice(0, 5)
      .replace(/\s/g, "");

    // Generate date string
    const now = new Date();
    const yy = now.getFullYear().toString().slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yy}${mm}${dd}`;

    // Calculate daily counter
    const dayStart = new Date(now.setHours(0, 0, 0, 0));
    const dayEnd = new Date(now.setHours(23, 59, 59, 999));

    const dailyCount = await Invoice.countDocuments({
      company: companyId,
      branch: branchId,
      createdAt: { $gte: dayStart, $lte: dayEnd },
    });

    const runningCounter = String(dailyCount + 1).padStart(4, "0");
    const docketNumber = `DLC-${companyCode}-${branchCode}-${dateStr}-${runningCounter}`;

    if (req.body.vehicleType === "Vendor") {
      const vendor = await Vendor.findById(req.body.vendor);
      if (!vendor) {
        return res.status(400).json({ success: false, message: "Invalid vendor selected" });
      }

      const selectedVendorVehicle = vendor.availableVehicles.find(
        (v) => v.vehicleNumber === req.body.vendorVehicleNumber
      );

      if (!selectedVendorVehicle) {
        return res.status(400).json({
          success: false,
          message: "Selected vendor vehicle not found",
        });
      }

      req.body.vendorVehicle = selectedVendorVehicle;
    } else if (req.body.vehicleType === "Dellcube") {
      if (!req.body.vehicle) {
        return res.status(400).json({
          success: false,
          message: "Vehicle is required for Dellcube type",
        });
      }
    }

    // The following fields are now supported: pickupAddress, deliveryAddress, consignor, consignee, address, invoiceNumber, invoiceBill, ewayBillNo, driverContactNumber, siteId, sealNo, vehicleSize, orderNumber, transportMode
    const invoice = await Invoice.create({
      ...req.body,
      company: companyId,
      branch: branchId,
      docketNumber,
      orderNumber: req.body.orderNumber || "",
      transportMode: req.body.transportMode,
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the invoice",
      error: error.message,
    });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      companyId,
      branchId,
      customerId,
      paymentType,
      vehicleType,
      invoiceDate,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const query = {};
    if (search) query.docketNumber = { $regex: search, $options: "i" };
    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;
    if (customerId) query.customer = customerId;
    if (paymentType) query.paymentType = paymentType;
    if (vehicleType) query.vehicleType = vehicleType;
    // Date range filtering
    if (req.query.fromDate || req.query.toDate) {
      const dateQuery = {};
      if (req.query.fromDate) {
        const from = new Date(req.query.fromDate);
        from.setHours(0, 0, 0, 0);
        dateQuery.$gte = from;
      }
      if (req.query.toDate) {
        const to = new Date(req.query.toDate);
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }
      query.invoiceDate = dateQuery;
    } else if (invoiceDate) {
      // Fallback: single day filter for backward compatibility
      const start = new Date(invoiceDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(invoiceDate);
      end.setHours(23, 59, 59, 999);
      query.invoiceDate = { $gte: start, $lte: end };
    }

    const invoices = await Invoice.find(query)
      .populate("company", "name address contactPhone gstNumber")
      .populate("branch", "name")
      .populate("customer", "name phone email")
      .populate("goodsType", "name items")
      .populate("vehicle", "vehicleNumber")
      .populate("vendor", "name availableVehicles")
      .populate("driver", "name phone")
      .populate(
        "fromAddress.country fromAddress.state fromAddress.city fromAddress.locality fromAddress.pincode"
      )
      .populate(
        "toAddress.country toAddress.state toAddress.city toAddress.locality toAddress.pincode"
      )
      .populate("siteType", "name desc")
      .populate("transportMode", "name desc")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching invoices",
      error: error.message,
    });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Valid invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(invoiceId)
      .populate("goodsType", "name items")
      .populate("company branch customer  vehicle vendor driver")
      .populate("siteType", "name desc")
      .populate("transportMode", "name desc")
      .populate(
        "fromAddress.country fromAddress.state fromAddress.city fromAddress.locality fromAddress.pincode"
      )
      .populate(
        "toAddress.country toAddress.state toAddress.city toAddress.locality toAddress.pincode"
      );

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching invoice",
      error: error.message,
    });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { invoiceId, ...updates } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Valid invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        invoice[key] = updates[key];
      }
    });
    // Ensure orderNumber is updated if provided
    if (updates.orderNumber !== undefined) {
      invoice.orderNumber = updates.orderNumber;
    }
    // Ensure transportMode is updated if provided
    if (updates.transportMode !== undefined) {
      invoice.transportMode = updates.transportMode;
    }

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the invoice",
      error: error.message,
    });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid invoice ID is required" });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    await Invoice.findByIdAndDelete(invoiceId);

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the invoice",
      error: error.message,
    });
  }
};

export const generateDellcubeInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: "Valid invoice ID is required" });
    }
    const invoice = await Invoice.findById(invoiceId)
      .populate("company branch customer goodsType vehicle vendor driver")
      .populate("siteType", "name desc")
      .populate("fromAddress.country fromAddress.state fromAddress.city fromAddress.locality fromAddress.pincode")
      .populate("toAddress.country toAddress.state toAddress.city toAddress.locality toAddress.pincode");
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    if (invoice.vehicleType !== "Dellcube") {
      return res.status(400).json({ success: false, message: "PDF generation only supported for Dellcube invoices." });
    }

    // Prepare logo as base64
    const logoPath = path.resolve("client/public/images/dellcube_logo-og.png");
    let logoBase64 = "";
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }

    const invoiceHtml = (inv) => `
    <div class="invoice">
      <div class="header">${inv?.company?.name || "-"}</div>
      <div class="sub-header">
        ${inv?.company?.address || "-"}<br />
        Ph: ${inv?.company?.contactPhone || "-"} | Email: ${inv?.company?.email || "-"} | Web: ${inv?.company?.website || "-"}
      </div>
  
      <table>
        <tr>
          <td colspan="2"><strong>GSTIN:</strong> ${inv?.company?.gstNumber || "-"}</td>
          <td colspan="2"><strong>PAN:</strong> ${inv?.company?.pan || "-"}</td>
          <td colspan="2" class="right"><strong>DOCKET NO:</strong> ${inv?.docketNumber || "-"}</td>
        </tr>
        <tr>
          <td colspan="6" class="section-title">BOOKING PARTICULARS</td>
        </tr>
        <tr>
          <td><strong>Booking Branch:</strong></td><td>${inv?.branch?.name || "-"}</td>
          <td><strong>Delivery Branch:</strong></td><td>${inv?.toAddress?.city?.name || "-"}</td>
          <td><strong>Date:</strong></td>
          <td>
            ${inv?.invoiceDate
        ? new Date(inv.invoiceDate).toISOString().slice(0, 10)
        : inv?.createdAt
          ? new Date(inv.createdAt).toISOString().slice(0, 10)
          : "-"
      }
          </td>  
        </tr>
        <tr>
          <td><strong>Document No:</strong></td><td>${inv?.documentNo || "-"}</td>
          <td><strong>Road Permit No:</strong></td><td>${inv?.roadPermitNo || "-"}</td>
          <td><strong>Way Bill No:</strong></td><td>${inv?.ewayBillNo || inv?.wayBillNo || "-"}</td>
        </tr>
      </table>
  
      <table>
        <tr>
          <td colspan="3"><strong>Insurance Company:</strong> ${inv?.insuranceCompany || "-"}</td>
          <td colspan="3"><strong>Policy No. & Validity:</strong> ${inv?.policyNo || "-"}</td>
        </tr>
        <tr>
          <td><strong>Vehicle No:</strong></td><td colspan="2">${inv?.vehicle?.vehicleNumber || inv?.vendorVehicle?.vehicleNumber || "-"}</td>
          <td><strong>Vehicle Type:</strong></td><td colspan="2">${inv?.vehicleType || "-"}</td>
        </tr>
      </table>
  
      <table>
        <tr>
          <td><strong>Consignor Address:</strong></td>
          <td colspan="2">
            ${inv?.fromAddress?.locality?.name || ""}, ${inv?.fromAddress?.city?.name || ""}, 
            ${inv?.fromAddress?.state?.name || ""}, ${inv?.fromAddress?.country?.name || ""} - 
            ${inv?.fromAddress?.pincode?.code || ""}
          </td>
        </tr>
        <tr>
          <td><strong>Consignee Address:</strong></td>
          <td colspan="2">
            ${inv?.toAddress?.locality?.name || ""}, ${inv?.toAddress?.city?.name || ""}, 
            ${inv?.toAddress?.state?.name || ""}, ${inv?.toAddress?.country?.name || ""} - 
            ${inv?.toAddress?.pincode?.code || ""}
          </td>
        </tr>
      </table>
  
      <table>
        <tr>
          <th>QTY</th>
          <th>MATERIAL DESCRIPTION</th>
          <th>WEIGHT</th>
          <th>VALUE (Rs.)</th>
        </tr>
        <tr>
          <td>${inv?.numberOfPackages || "-"}</td>
          <td>${inv?.goodsType?.name || "-"}</td>
          <td>${inv?.totalWeight || "-"} kg</td>
          <td>${inv?.goodsValue || "-"}</td>
        </tr>
      </table>
  
      <table>
        <tr>
          <th>Rate/Kg</th><th>Basic</th><th>Freight</th><th>A.O.C</th><th>Hamali</th>
          <th>D.D. Charges</th><th>Service</th><th>To Pay</th><th>Total</th>
        </tr>
        <tr>
          <td>${inv?.ratePerKg || "-"}</td>
          <td>${inv?.freightRs || "0.00"}</td>
          <td>${inv?.freightCharges || "0.00"}</td>
          <td>${inv?.aoc || "0.00"}</td>
          <td>${inv?.hamali || "0.00"}</td>
          <td>${inv?.ddCharges || "0.00"}</td>
          <td>${inv?.serviceCharge || "0.00"}</td>
          <td>${inv?.toPay || "0.00"}</td>
          <td>${inv?.total || "0.00"}</td>
        </tr>
      </table>
  
      <div class="signature-box">
        <div>
          <strong>Receiver Name:</strong> ${inv?.receiverName || "___________"}<br />
          <strong>Date/Time:</strong> ${inv?.receiverDateTime || "___________"}
        </div>
        <div><strong>Signature:</strong> ____________________</div>
      </div>
  
      <div class="footer">For: ${inv?.company?.name || "-"}</div>
    </div>
  `;

    // Place 2 invoices per A4 page (for now, just duplicate for demo)
    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Dellcube Invoice PDF</title>
        <style>
          body { background: #f7f7f7; margin: 0; padding: 0; }
          .invoice-page { width: 210mm; height: 297mm; padding: 24px; box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div class="invoice-page">
          ${invoiceHtml(invoice)}
          ${invoiceHtml(invoice)}
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 16, bottom: 16, left: 16, right: 16 },
    });
    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice_${invoice.docketNumber}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).json({ success: false, message: "Failed to generate PDF", error: error.message });
  }
};


// const getChromePath = () => {
//   if (process.env.IS_RENDER === "true") {
//     return path.resolve(".cache/puppeteer/chrome/linux-*/chrome-linux64/chrome"); // wildcard safe
//   }
//   return "/Users/adityathakur/.cache/puppeteer/chrome/mac_arm-121.0.6167.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
// };


// let browserPromise = null;

// async function getBrowser() {
//   if (!browserPromise) {
//     browserPromise = puppeteer.launch({
//       headless: true,
//       executablePath: getChromePath(),
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--disable-gpu',
//       ],
//     });
//   }
//   return browserPromise;
// }


// const getChromePath = () => {
//   if (process.env.NODE_ENV === 'production') {
//     // For Render and other cloud platforms
//     return process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
//   } else {
//     // For local development, let Puppeteer find Chrome
//     return puppeteer.executablePath();
//   }
// };

// let browserPromise = null;

// async function getBrowser() {
//   if (browserPromise) {
//     return browserPromise;
//   }
  
//   browserPromise = puppeteer.launch({
//     headless: true,
//     executablePath: getChromePath(),
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-dev-shm-usage',
//       '--disable-accelerated-2d-canvas',
//       '--no-first-run',
//       '--no-zygote',
//       '--single-process',
//       '--disable-gpu',
//       '--disable-web-security',
//       '--disable-features=VizDisplayCompositor'
//     ]
//   });
  
//   return browserPromise;
// }
 

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getChromePath = () => {
  if (process.env.IS_RENDER === "true") {
    // Try system Chrome first
    const systemChrome = '/usr/bin/google-chrome-stable';
    if (fs.existsSync(systemChrome)) {
      console.log('Using system Chrome:', systemChrome);
      return systemChrome;
    }
    
    // Try other common system paths
    const potentialPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    
    for (const chromePath of potentialPaths) {
      if (fs.existsSync(chromePath)) {
        console.log('Using Chrome from path:', chromePath);
        return chromePath;
      }
    }
    
    // Try to find Puppeteer's bundled Chrome manually
    const puppeteerCachePaths = [
      '/opt/render/project/puppeteer/chrome',
      path.join(__dirname, '.cache/puppeteer/chrome'),
      path.join(process.cwd(), '.cache/puppeteer/chrome')
    ];
    
    for (const cachePath of puppeteerCachePaths) {
      if (fs.existsSync(cachePath)) {
        try {
          // Look for Chrome executable in subdirectories
          const subdirs = fs.readdirSync(cachePath);
          for (const subdir of subdirs) {
            const chromePath = path.join(cachePath, subdir, 'chrome-linux64/chrome');
            if (fs.existsSync(chromePath)) {
              console.log('Using cached Chrome:', chromePath);
              return chromePath;
            }
          }
        } catch (error) {
          console.log('Error searching cache:', error.message);
        }
      }
    }
    
    // Final fallback - let Puppeteer decide
    try {
      const executablePath = puppeteer.executablePath();
      console.log('Using Puppeteer default:', executablePath);
      return executablePath;
    } catch (error) {
      console.error('Could not find Chrome executable:', error);
      throw new Error('Chrome executable not found');
    }
  }
  
  // Local development path
  return "/Users/adityathakur/.cache/puppeteer/chrome/mac_arm-121.0.6167.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
};

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    const executablePath = getChromePath();
    
    browserPromise = puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--ignore-ssl-errors-spki-list',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
    });
  }
  return browserPromise;
}

// Graceful shutdown
process.on('exit', async () => {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
  }
});

export { getBrowser, getChromePath };


export const generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: "Valid invoice ID is required" });
    }
    const invoice = await Invoice.findById(invoiceId)
      .populate("company branch customer goodsType vehicle vendor driver")
      .populate("siteType", "name desc")
      .populate("fromAddress.country fromAddress.state fromAddress.city fromAddress.locality fromAddress.pincode")
      .populate("toAddress.country toAddress.state toAddress.city toAddress.locality toAddress.pincode");
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Prepare logo as base64 (fallback to empty string if missing)
    const logoPath = path.resolve("client/public/images/dellcube_logo-og.png");
    let logoBase64 = "";
    try {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (e) {
      logoBase64 = "";
    }

    let html = "";
    try {
      html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Dellcube Docket PDF</title>
          <style>
            body {
              background: #fff;
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .page {
              width: 210mm;
              height: 197mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              padding: 0;
              gap: 0;
            }
            .docket-copy {
              background: #fff;
              border: 2px solid #000;
              width: 99.2%;
              height: auto;
              min-height: 45%;
              margin: 0 auto;
              padding: 2px 4px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              gap: 1px;
              position: relative;
              font-size: 9px;
            }
            .docket-gap {
              height: 3mm;
              width: 100%;
              background: transparent;
            }
            .docket-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0;
              margin-bottom: 2px;
              border-bottom: 1px solid #000;
              padding-bottom: 2px;
            }
            .company-logo {
              width: 70px;
              height: auto;
              margin-bottom: 1px;
            }
            .company-title {
              font-size: 12px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 1px;
              text-transform: uppercase;
            }
            .company-info {
              font-size: 8px;
              text-align: center;
              margin-bottom: 0;
              line-height: 1.1;
            }
            .content-section {
              display: flex;
              flex-direction: column;
              gap: 1px;
            }
            .info-row {
              display: flex;
              width: 100%;
              gap: 2px;
              margin-bottom: 1px;
            }
            .info-left {
              width: 58%;
            }
            .info-right {
              width: 42%;
            }
            .docket-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
              border: 1px solid #000;
            }
            .docket-table th, .docket-table td {
              border: 1px solid #000;
              padding: 1px 2px;
              text-align: left;
              line-height: 1.1;
            }
            .docket-table th {
              background: #e8e8e8;
              color: #000;
              font-weight: bold;
              font-size: 7px;
              text-align: center;
            }
            .label-cell {
              font-weight: bold;
              font-size: 7px;
              width: 35%;
              background: #f5f5f5;
            }
            .value-cell {
              font-size: 7px;
              background: #fff;
            }
            .material-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
              border: 1px solid #000;
              margin: 1px 0;
            }
            .material-table th, .material-table td {
              border: 1px solid #000;
              padding: 1px 2px;
              text-align: center;
              line-height: 1.1;
            }
            .material-table th {
              background: #e8e8e8;
              color: #000;
              font-weight: bold;
              font-size: 7px;
            }
            .charges-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 7px;
              border: 1px solid #000;
              margin: 1px 0;
            }
            .charges-table th, .charges-table td {
              border: 1px solid #000;
              padding: 1px 2px;
              text-align: center;
              line-height: 1.1;
            }
            .charges-table th {
              background: #e8e8e8;
              color: #000;
              font-weight: bold;
              font-size: 6px;
            }
            .footer-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              font-size: 8px;
              border-top: 1px solid #000;
              margin-top: 2px;
              padding-top: 2px;
            }
            .footer-left {
              width: 48%;
            }
           .footer-wrapper {
  display: flex;
  flex-direction: column;
  height: 55px; 
  padding: 10px;
  position: relative;
}

.footer-right {
  margin-top: auto;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
            .company-signature-section {
              margin-top: 2px;
            }
            .docket-copy-title {
              position: absolute;
              top: 2px;
              right: 8px;
              font-size: 8px;
              font-weight: bold;
              border: 1px solid #000;
              padding: 1px 4px;
              background: #fff;
            }
            .docket-number-box {
              position: absolute;
              top: 15px;
              right: 8px;
              font-size: 10px;
              font-weight: bold;
              border: 2px solid #000;
              padding: 2px 6px;
              background: #fff;
              letter-spacing: 1px;
            }
            .section-header {
              background: #e8e8e8;
              color: #000;
              font-weight: bold;
              text-align: center;
              font-size: 7px;
            }
            .signature-box {
              width: 80px;
              height: 20px;
              border: 1px solid #000;
              margin-top: 2px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 6px;
            }
         
          </style>
        </head>
        <body>
          <div class="page">
            ${docketHtml(invoice, logoBase64, 'CONSIGNOR COPY')}
            <div class="docket-gap"></div>
            ${docketHtml(invoice, logoBase64, 'OFFICE COPY')}
          </div>
        </body>
        </html>
      `;
    } catch (err) {
      html = `<html><body><div style='color:red;'>Error rendering invoice HTML: ${err.message}</div></body></html>`;
    }

    function docketHtml(inv, logo, copyType) {
      // Merge pickupAddress with fromAddress
      const fromFull = [
        inv?.pickupAddress,
        inv?.fromAddress?.locality?.name,
        inv?.fromAddress?.city?.name,
        inv?.fromAddress?.state?.name,
        inv?.fromAddress?.country?.name
      ].filter(Boolean).join(", ") + (inv?.fromAddress?.pincode?.code ? " - " + inv.fromAddress.pincode.code : "");
      // Merge deliveryAddress with toAddress
      const toFull = [
        inv?.deliveryAddress,
        inv?.toAddress?.locality?.name,
        inv?.toAddress?.city?.name,
        inv?.toAddress?.state?.name,
        inv?.toAddress?.country?.name
      ].filter(Boolean).join(", ") + (inv?.toAddress?.pincode?.code ? " - " + inv.toAddress.pincode.code : "");
      return `
        <div class="docket-copy">
          <div class="docket-copy-title">${copyType}</div>
          <div class="docket-number-box">${inv?.docketNumber || "-"}</div>
          <div class="docket-header">
            ${logo ? `<img src="${logo}" class="company-logo" />` : ""}
            <div class="company-title">${inv?.company?.name || "DELLCUBE INTEGRATED SOLUTIONS PVT. LTD."}</div>
            <div class="company-info">
              ${inv?.company?.address || "Babosa Industrial Park, Bldg. No. A-4, Gr. Floor, Unit No. 10, Saravali Village, Bhiwandi - 421 302, Dist. Thane."}<br/>
              Ph: ${inv?.company?.contactPhone || "02522-280222"} | Website: ${inv?.company?.website || "www.dellcube.com"} | Email: ${inv?.company?.email || "info@dellcube.com"}
            </div>
          </div>
          <div class="content-section">
            <div class="info-row">
              <div class="info-left">
                <table class="docket-table">
                  <tr><td class="label-cell">GSTIN:</td><td class="value-cell">${inv?.company?.gstNumber || "-"}</td></tr>
                  <tr><td class="label-cell">PAN:</td><td class="value-cell">${inv?.company?.pan || "-"}</td></tr>
                  <tr><th colspan="2" class="section-header">BOOKING PARTICULARS</th></tr>
                  <tr><td class="label-cell">Booking Branch</td><td class="value-cell">${inv?.branch?.name || "-"}</td></tr>
                  <tr><td class="label-cell">Delivery Branch</td><td class="value-cell">${inv?.toAddress?.city?.name || "-"}</td></tr>
                  <tr><td class="label-cell">Order No.</td><td class="value-cell">${inv?.orderNumber || "-"}</td></tr>
                  <tr><td class="label-cell">Site ID</td><td class="value-cell">${inv?.siteId || "-"}</td></tr>
                  <tr><td class="label-cell">Seal No</td><td class="value-cell">${inv?.sealNo || "-"}</td></tr>
                  <tr><td class="label-cell">Eway Bill No.</td><td class="value-cell">${inv?.ewayBillNo || inv?.wayBillNo || "-"}</td></tr>
                  <tr><td class="label-cell">Consignor</td><td class="value-cell">${inv?.consignor || "-"}</td></tr>
                  <tr><td class="label-cell">Consignee</td><td class="value-cell">${inv?.consignee || "-"}</td></tr>
                  <tr><td class="label-cell">From Address</td><td class="value-cell">${fromFull || "-"}</td></tr>
                  <tr><td class="label-cell">To Address</td><td class="value-cell">${toFull || "-"}</td></tr>
                  <tr><td class="label-cell">Remarks</td><td class="value-cell">${inv?.remarks || "-"}</td></tr>
                </table>
              </div>
              <div class="info-right">
                <table class="docket-table">
                  <tr><th colspan="2" class="section-header">RISK COVERAGE OF CARGO<br/>AT OWNER'S RISK</th></tr>
                  <tr><td class="label-cell">Vehicle No.</td><td class="value-cell">${inv?.vehicle?.vehicleNumber || inv?.vendorVehicle?.vehicleNumber || "-"}</td></tr>
                  <tr><td class="label-cell">Vehicle Type:</td><td class="value-cell">${inv?.vehicleType || "-"}</td></tr>
                  <tr><td class="label-cell">Vehicle Size:</td><td class="value-cell">${inv?.vehicleSize || "-"}</td></tr>
                  <tr><td class="label-cell">Vendor:</td><td class="value-cell">${inv?.vendor?.name || "-"}</td></tr>
                  <tr><td class="label-cell">Driver:</td><td class="value-cell">${inv?.driver?.name || "-"}</td></tr>
                  <tr><td class="label-cell">Driver Contact:</td><td class="value-cell">${inv?.driverContactNumber || "-"}</td></tr>
                  <tr><td class="label-cell">Payment Type:</td><td class="value-cell">${inv?.paymentType || "-"}</td></tr>
                  <tr><td class="label-cell">Status:</td><td class="value-cell">${inv?.status || "-"}</td></tr>
                   <tr><td class="label-cell">Site Type:</td><td class="value-cell">${inv?.siteType?.name || "-"}</td></tr>
                   <tr><td class="label-cell">Transport Mode:</td><td class="value-cell">${inv?.transportMode?.name || "-"}</td></tr>
                  <tr><th colspan="2" class="section-header">DOCKET NO.</th></tr>
                  <tr><td colspan="2" style="font-size:12px;font-weight:bold;text-align:center;letter-spacing:2px;padding:4px;">${inv?.docketNumber || "-"}</td></tr>
                  <tr><td class="label-cell">Date:</td><td class="value-cell">${inv?.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : inv?.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN') : "-"}</td></tr>
                </table>
              </div>
            </div>
            <table class="material-table">
              <tr>
                <th style="width:8%;">QTY.</th>
                <th style="width:52%;">MATERIAL DESCRIPTION (Said to Contain)</th>
                <th style="width:12%;">WEIGHT (Kg)</th>
                <th style="width:28%;">VALUE (Rs.)</th>
              </tr>
              <tr>
                <td>${inv?.numberOfPackages || "-"}</td>
                <td style="text-align:left;">${inv?.goodsType?.name || "-"} ${inv?.goodsType?.items?.length ? '(' + inv.goodsType.items.join(', ') + ')' : ''}</td>
                <td>${inv?.totalWeight || "-"}</td>
                <td>${inv?.goodsValue ? "₹" + parseFloat(inv.goodsValue).toLocaleString('en-IN') : "-"}</td>
              </tr>
            </table>
            <table class="charges-table">
              <tr>
                <th style="width:8%;">Rate/Kg</th>
                <th style="width:8%;">Basic</th>
                <th style="width:8%;">Freight</th>
                <th style="width:8%;">A.O.C.</th>
                <th style="width:8%;">Hamali</th>
                <th style="width:8%;">D.D. Charges</th>
                <th style="width:8%;">St. Charges</th>
                <th style="width:8%;">Service</th>
                <th style="width:8%;">Paid</th>
                <th style="width:8%;">To Pay</th>
                <th style="width:8%;">T.B.B.</th>
                <th style="width:12%;">Total</th>
              </tr>
              <tr>
                <td>${inv?.ratePerKg ? "₹" + parseFloat(inv.ratePerKg).toFixed(2) : "-"}</td>
                <td>${inv?.freightRs ? "₹" + parseFloat(inv.freightRs).toFixed(2) : "-"}</td>
                <td>${inv?.freightCharges ? "₹" + parseFloat(inv.freightCharges).toFixed(2) : "-"}</td>
                <td>${inv?.aoc ? "₹" + parseFloat(inv.aoc).toFixed(2) : "-"}</td>
                <td>${inv?.hamali ? "₹" + parseFloat(inv.hamali).toFixed(2) : "-"}</td>
                <td>${inv?.ddCharges ? "₹" + parseFloat(inv.ddCharges).toFixed(2) : "-"}</td>
                <td>${inv?.stCharges ? "₹" + parseFloat(inv.stCharges).toFixed(2) : "-"}</td>
                <td>${inv?.serviceCharge ? "₹" + parseFloat(inv.serviceCharge).toFixed(2) : "-"}</td>
                <td>${inv?.paid ? "₹" + parseFloat(inv.paid).toFixed(2) : "-"}</td>
                <td>${inv?.toPay ? "₹" + parseFloat(inv.toPay).toFixed(2) : "-"}</td>
                <td>${inv?.tbb ? "₹" + parseFloat(inv.tbb).toFixed(2) : "-"}</td>
                <td style="font-weight:bold;">${inv?.total ? "₹" + parseFloat(inv.total).toLocaleString('en-IN') : "-"}</td>
              </tr>
            </table>
            <div class="footer-section">
              <div class="footer-left">
                <div><strong>Receiver's Name:</strong> ${inv?.deliveryProof?.receiverName || inv?.receiverName || "____________"}</div>
                <div><strong>Date/Time:</strong> ${inv?.deliveredAt ? new Date(inv.deliveredAt).toLocaleString('en-IN') : inv?.receiverDateTime || "____________"}</div>
                <div><strong>Mobile No.:</strong> ${inv?.deliveryProof?.receiverMobile || inv?.receiverMobile || "____________"}</div>
                <div style="margin-top:2px;"><strong>Receiver's Signature:</strong></div>
                <div class="signature-box">
                  ${inv?.deliveryProof?.signature ? `<img src="${inv?.deliveryProof?.signature}" style="max-width:75px;max-height:18px;" />` : ""}
                </div>
              </div>
              <div class="footer-wrapper">
                <div class="footer-right">
                  <div><strong>For:</strong> ${inv?.company?.name || "Dellcube Integrated Solutions Pvt. Ltd."}</div>
                
    
                  <div style="margin-top:2px;"><strong>Authorized Signatory</strong></div>
               
              </div>
 
          </div>
            </div>
          </div>
        </div>
      `;
    }

    try {
      fs.writeFileSync("/tmp/invoice-debug.html", html);
      console.log("[PDF DEBUG] HTML written to /tmp/invoice-debug.html");
    } catch (e) {
      console.error("Failed to write debug HTML:", e);
    }

    // Puppeteer PDF generation with error handling
    let pdfBuffer;
    let browser = null;
    let page = null;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: 5, bottom: 5, left: 5, right: 5 },
        landscape: false,
      });
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        console.warn("[PDF DEBUG] Generated PDF buffer is very small (likely blank/corrupt)");
      }
    } catch (err) {
      console.error("Puppeteer PDF generation error:", err);
      try { fs.writeFileSync("/tmp/invoice-debug-error.html", html); } catch (e) { }
      return res.status(500).json({ success: false, message: "Failed to generate PDF (Puppeteer error)", error: err.message });
    } finally {
      if (page) await page.close();
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-disposition": `attachment; filename=invoice_${invoice.docketNumber}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).json({ success: false, message: "Failed to generate PDF", error: error.message });
  }
};

// Export Invoices as CSV
export const exportInvoicesCSV = async (req, res) => {
  try {
    let {
      search = "",
      companyId,
      branchId,
      customerId,
      paymentType,
      vehicleType,
      fromDate,
      toDate,
      ids,
    } = req.query;

    const query = {};
    if (ids) {
      // Export only selected invoices
      const idArr = ids.split(',').map((id) => id.trim());
      query._id = { $in: idArr };
    } else {
      if (search) query.docketNumber = { $regex: search, $options: "i" };
      if (companyId) query.company = companyId;
      if (branchId) query.branch = branchId;
      if (customerId) query.customer = customerId;
      if (paymentType) query.paymentType = paymentType;
      if (vehicleType) query.vehicleType = vehicleType;
      if (fromDate || toDate) {
        const dateQuery = {};
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          dateQuery.$gte = from;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          dateQuery.$lte = to;
        }
        query.invoiceDate = dateQuery;
      }
    }

    const invoices = await Invoice.find(query)
      .populate("company", "name address contactPhone gstNumber panNumber")
      .populate("branch", "name")
      .populate("customer", "name phone email")
      .populate("goodsType", "name items")
      .populate("vehicle", "vehicleNumber")
      .populate("vendor", "name availableVehicles")
      .populate("driver", "name phone")
      .populate("fromAddress.country fromAddress.state fromAddress.city fromAddress.locality fromAddress.pincode")
      .populate("toAddress.country toAddress.state toAddress.city toAddress.locality toAddress.pincode");

    // Flatten and map fields for CSV
    const data = invoices.map((inv) => ({
      DocketNumber: inv.docketNumber,
      Company: inv.company?.name || "",
      CompanyAddress: inv.company?.address || "",
      CompanyGST: inv.company?.gstNumber || "",
      CompanyPAN: inv.company?.panNumber || "",
      Branch: inv.branch?.name || "",
      Customer: inv.customer?.name || "",
      CustomerPhone: inv.customer?.phone || "",
      CustomerEmail: inv.customer?.email || "",
      GoodsType: inv.goodsType?.name || "",
      GoodsItems: inv.goodsType?.items?.join('; ') || "",
      VehicleType: inv.vehicleType,
      VehicleNumber: inv.vehicle?.vehicleNumber || inv.vendorVehicle?.vehicleNumber || "",
      Vendor: inv.vendor?.name || "",
      Driver: inv.driver?.name || "",
      DriverPhone: inv.driver?.phone || "",
      Status: inv.status,
      InvoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleString() : "",
      DispatchDateTime: inv.dispatchDateTime ? new Date(inv.dispatchDateTime).toLocaleString() : "",
      FromCountry: inv.fromAddress?.country?.name || "",
      FromState: inv.fromAddress?.state?.name || "",
      FromCity: inv.fromAddress?.city?.name || "",
      FromLocality: inv.fromAddress?.locality?.name || "",
      FromPincode: inv.fromAddress?.pincode?.code || "",
      ToCountry: inv.toAddress?.country?.name || "",
      ToState: inv.toAddress?.state?.name || "",
      ToCity: inv.toAddress?.city?.name || "",
      ToLocality: inv.toAddress?.locality?.name || "",
      ToPincode: inv?.toAddress?.pincode?.code || "",
      TotalWeight: inv?.totalWeight,
      NumberOfPackages: inv?.numberOfPackages,
      FreightCharges: inv?.freightCharges,
      PaymentType: inv?.paymentType,
      Remarks: inv?.remarks,
      DeliveredAt: inv.deliveredAt ? new Date(inv.deliveredAt).toLocaleString() : "",
      DeliveryProofReceiverName: inv.deliveryProof?.receiverName || "",
      DeliveryProofReceiverMobile: inv.deliveryProof?.receiverMobile || "",
      DeliveryProofRemarks: inv.deliveryProof?.remarks || "",
      CreatedAt: inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "",
      UpdatedAt: inv.updatedAt ? new Date(inv.updatedAt).toLocaleString() : "",
    }));

    const fields = Object.keys(data[0] || {});
    const json2csv = new Json2CsvParser({ fields });
    const csv = json2csv.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('invoices_export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting invoices as CSV:', error);
    return res.status(500).json({ success: false, message: 'Failed to export invoices as CSV', error: error.message });
  }
};



