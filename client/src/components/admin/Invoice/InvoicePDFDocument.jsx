import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// FieldInputView for consistent value display (compact for better page fit)
const FieldInputView = ({ value, style, landscape }) => {
  const boxStyle = landscape
    ? { minHeight: 12, paddingVertical: 0.35 }
    : { minHeight: 8, paddingVertical: 0.3 };
  const textSize = landscape ? 13 : 11;
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: "#ccc",
          paddingHorizontal: 1,
          justifyContent: "center",
          backgroundColor: "#f9f9f9",
          alignItems: "center",
          width: "100%",
        },
        boxStyle,
        style,
      ]}
    >
      <Text style={{ fontSize: textSize, textAlign: "center", width: "100%", lineHeight: 1.15 }}>
        {value}
      </Text>
    </View>
  );
};

const renderMultiValue = (value, fallback = "") => {
  if (Array.isArray(value)) {
    return value.length ? value.join("\n") : fallback;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) return fallback;
    return trimmed.includes(",") ? trimmed.split(",").map((v) => v.trim()).join("\n") : trimmed;
  }
  return fallback;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    fontFamily: "Helvetica",
    paddingTop: "4mm",
    paddingBottom: "4mm",
    paddingLeft: "5mm",
    paddingRight: "5mm",
  },
  pageContainer: {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "stretch",
    padding: 0,
    justifyContent: "flex-start",
    gap: "2mm",
  },
  // Variants for landscape pages – reduce top/bottom whitespace and let content grow
  landscapePage: {
    paddingTop: "3mm",
    paddingBottom: "3mm",
    paddingLeft: "5mm",
    paddingRight: "5mm",
  },
  landscapePageContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 0,
  },
  docketCopy: {
    backgroundColor: "#fff",
    border: "1.5px solid #000",
    width: "100%",
    margin: 0,
    paddingTop: "0.8mm",
    paddingBottom: "0.6mm",
    paddingLeft: "1.2mm",
    paddingRight: "1.2mm",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    fontSize: 8,
    justifyContent: "flex-start",
    flexShrink: 0,
  },
  // Make the single docket copy fill more of the landscape page height
  landscapeDocketCopy: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 0,
  },

  // Header Section
  headerSection: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: "0.2mm",
    paddingBottom: 0,
  },
  logoSection: {
    width: "15%",
    alignItems: "center",
    paddingRight: "1.5mm",
  },
  companyLogo: {
    width: 80,
    height: 30,
  },
  companySection: {
    width: "65%",
    alignItems: "center",
    paddingHorizontal: "0.5mm",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "0.1mm",
    textTransform: "uppercase",
    lineHeight: 1.15,
  },
  companyContact: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 1.15,
    marginBottom: "0.1mm",
  },
  companyAddress: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 1.15,
    marginBottom: "0.1mm",
  },
 
  copyTypeSection: {
    width: "20%",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingLeft: "0.5mm",
  },
  copyType: {
    fontSize: 9,
    fontWeight: "bold",
    border: "1px solid #000",
    padding: "0.25mm",
    textAlign: "center",
    backgroundColor: "#f0f0f0",
  },
  docketNumber: {
    fontSize: 16,
    fontWeight: "bold",
    border: "1.5px solid #000",
    paddingVertical: "0.5mm",
    paddingHorizontal: "0.6mm",
    textAlign: "center",
    marginTop: "0.2mm",
    backgroundColor: "#fff",
    letterSpacing: 0,
    width: "100%",
    flexShrink: 0,
    lineHeight: 1.2,
    flexWrap: "wrap",
  },
  dateInHeader: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: "0.2mm",
  },

  // Company Details Row - Updated layout (kept for potential future use, but not displayed)
  companyDetailsRow: {
    flexDirection: "row",
    marginBottom: "0mm",
    marginTop: "0mm",
    height: 0,
    display: "none",
  },
  leftDetails: {
    width: "65%",
    flexDirection: "row",
    alignItems: "center",
    gap: "0.8mm",
    justifyContent: "flex-start",
  },
  centerDetails: {
    width: "15%",
  },
  rightDetails: {
    width: "20%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  panGstText: {
    fontSize: 8.5,
    fontWeight: "bold",
    textAlign: "left",
  },
  dateText: {
    fontSize: 9.5,
    fontWeight: "bold",
    textAlign: "right",
  },

  // Risk Notice Container
  riskContainer: {
    backgroundColor: "#f0f0f0",
    border: "1px solid #000",
    padding: "0.2mm",
    fontSize: 9,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: "0.2mm",
    marginTop: 0,
  },
  riskTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: "0.1mm",
  },
  riskNote: {
    fontSize: 9,
    fontWeight: "normal",
    lineHeight: 1.15,
  },

  // Delivery Container - New separate container
  deliveryContainer: {
    border: "1px solid #000",
    padding: "0.25mm",
    marginBottom: "0.15mm",
    backgroundColor: "#f9f9f9",
  },
  deliverySection: {
    flexDirection: "row",
    gap: "0.3mm",
  },
  deliveryColumn: {
    width: "50%",
    flexDirection: "column",
    gap: "0.1mm",
  },
  deliveryLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: "0.05mm",
  },
  deliveryInput: {
    border: "1px solid #000",
    padding: "0.2mm",
    minHeight: "4mm",
    backgroundColor: "#fff",
  },
  deliveryInputText: {
    fontSize: 11,
    lineHeight: 1.2,
  },

  // Main Content Area
  contentArea: {
    flexDirection: "row",
    gap: "0.3mm",
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  leftColumn: {
    width: "82%",
    flexDirection: "column",
    gap: "0.1mm",
    flexGrow: 1,
    minHeight: 0,
  },
  rightColumn: {
    width: "18%",
    flexDirection: "column",
    flexGrow: 1,
    minHeight: 0,
  },

  // Vehicle and Goods Table - Updated structure
  mainTable: {
    border: "1px solid #000",
    fontSize: 8,
  },
  // Landscape variant: make the main table larger to better fill the page
  mainTableLandscape: {
    fontSize: 14,
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottom: "1px solid #000",
  },
  tableHeaderCell: {
    padding: "0.3mm",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    borderRight: "1px solid #000",
  },
  tableHeaderCellLandscape: {
    padding: "0.35mm",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 22,
  },
  tableRowLandscape: {
    flexGrow: 1,
    minHeight: 40,
  },
  tableCell: {
    padding: "0.25mm",
    fontSize: 8,
    borderRight: "1px solid #000",
    minHeight: "3mm",
    alignItems: "center",
    justifyContent: "center",
  },
  tableCellLandscape: {
    padding: "0.3mm",
    fontSize: 13,
    minHeight: "3.5mm",
  },
  tableCellCenter: {
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: "0.08mm",
    textAlign: "center",
    width: "100%",
  },
  fieldLabelLandscape: {
    fontSize: 12,
    marginBottom: "0.08mm",
  },
  fieldValue: {
    fontSize: 8,
  },
  fieldValueLandscape: {
    fontSize: 13,
  },

  // Freight Chart Section (Right Column)
  freightSection: {
    border: "1px solid #000",
    fontSize: 6.5,
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  },
  freightHeader: {
    backgroundColor: "#e8e8e8",
    padding: "0.25mm",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    borderBottom: "1px solid #000",
    flexShrink: 0,
  },
  freightBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  freightRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    minHeight: "2.2mm",
  },
  freightTotalRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    minHeight: "2.2mm",
  },
  freightLabel: {
    width: "60%",
    padding: "0.2mm",
    fontSize: 11,
    borderRight: "1px solid #000",
    fontWeight: "bold",
    backgroundColor: "#f8f8f8",
  },
  freightValue: {
    width: "40%",
    padding: "0.2mm",
    fontSize: 11,
    textAlign: "right",
  },
  freightTotal: {
    backgroundColor: "#e8e8e8",
    fontWeight: "bold",
  },

  // Footer Section
  footerSection: {
    flexDirection: "row",
    borderTop: "1px solid #000",
    gap: "0.35mm",
    marginTop: "auto",
    marginBottom: 0,
  },
  receiverSection: {
    width: "82%",
    border: "1px solid #000",
    padding: "0.2mm",
    fontSize: 9,
    flexDirection: "column",
  },
  receiverHeader: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: "0.25mm",
    marginTop: 0,
    textAlign: "center",
    backgroundColor: "#f0f0f0",
    padding: "0.2mm",
    paddingVertical: "0.25mm",
  },
  receiverTableContainer: {
    flexDirection: "row",
    border: "1px solid #000",
    minHeight: "12mm",
  },
  receiverTableLeft: {
    width: "55%",
    borderRight: "1px solid #000",
    flexDirection: "column",
    padding: "0.15mm",
  },
  receiverTableRight: {
    width: "45%",
    flexDirection: "column",
    padding: "0.15mm",
    justifyContent: "flex-start",
    gap: "0.1mm",
  },
  receiverRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    minHeight: "2.2mm",
    alignItems: "flex-start",
    paddingVertical: "0.08mm",
  },
  receiverRowLast: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    minHeight: "2.2mm",
    alignItems: "flex-start",
    paddingVertical: "0.1mm",
  },
  receiverLabel: {
    fontSize: 10,
    fontWeight: "bold",
    width: "40%",
    borderRight: "1px solid #000",
    paddingRight: "0.2mm",
    paddingLeft: "0.1mm",
  },
  receiverValue: {
    fontSize: 10,
    width: "60%",
    paddingLeft: "0.2mm",
    textAlign: "left",
    lineHeight: 1.25,
  },
  receiverRightLabel: {
    fontSize: 10,
    fontWeight: "bold",
    width: "35%",
    borderRight: "1px solid #000",
    paddingRight: "0.2mm",
    paddingLeft: "0.1mm",
    paddingTop: "0.1mm",
    paddingBottom: "0.1mm",
  },
  receiverRightValue: {
    fontSize: 10,
    width: "65%",
    paddingLeft: "0.25mm",
    paddingRight: "0.15mm",
    paddingTop: "0.1mm",
    paddingBottom: "0.1mm",
    textAlign: "left",
    lineHeight: 1.25,
    flexWrap: "wrap",
    wordBreak: "break-word",
  },
  signatureBox: {
    width: "100%",
    height: "8mm",
    border: "1px solid #000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 5,
    backgroundColor: "#f9f9f9",
    marginTop: "0.15mm",
  },
  signatureImg: {
    width: "auto",
    maxWidth: "100%",
    maxHeight: "9mm",
    height: "auto",
  },
  companySignatureBox: {
    border: "1px dashed #000",
    borderRadius: 3,
    minHeight: "5mm",
    padding: "0.3mm",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "0.15mm",
  },
  companySignatureImg: {
    width: "auto",
    maxWidth: "55",
    maxHeight: "16",
    height: "auto",
  },
  authSection: {
    width: "18%",
    border: "1px solid #000",
    padding: "0.25mm",
    textAlign: "center",
    fontSize: 7,
    justifyContent: "space-between",
    flexDirection: "column",
  },
  authHeader: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: "0.2mm",
    marginTop: 0,
    lineHeight: 1.2,
    textAlign: "center",
  },
  authSignatory: {
    fontSize: 8,
    marginTop: "0.15mm",
    marginBottom: 0,
    paddingTop: "0.2mm",
    paddingBottom: 0,
  },
});

function InvoiceCopy({ invoice, logoBase64, copyType, containerStyle, variant }) {
  // Debug: Log invoice object at the start
  console.log("=== InvoiceCopy Component - Invoice Received ===");
  console.log("Invoice object:", invoice);
  console.log("Invoice keys:", invoice ? Object.keys(invoice) : "No invoice");
  console.log("=== End InvoiceCopy Component - Invoice Received ===");

  const safeFormatDate = (dateString, options = { time: false }) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    if (options.time) {
      return date.toLocaleString("en-IN");
    }
    return date.toLocaleDateString("en-IN");
  };

  const formatDateWithOrdinal = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    // Add ordinal suffix
    const getOrdinalSuffix = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };

  const formatAddressTwoLines = (address) => {
    if (!address) {
      return {
        line1: "Ground Floor Unit No. 10 Building No. A-4 Babosa Industrial Park",
        line2: "Saravali Village Bhiwandi - 421302"
      };
    }
    
    // Try to split at a logical point (e.g., before "Saravali" or "Bhiwandi")
    const addressStr = address.toString();
    const saravaliIndex = addressStr.indexOf("Saravali");
    const bhiwandiIndex = addressStr.indexOf("Bhiwandi");
    
    if (saravaliIndex > 0) {
      return {
        line1: addressStr.substring(0, saravaliIndex).trim(),
        line2: addressStr.substring(saravaliIndex).trim()
      };
    } else if (bhiwandiIndex > 0) {
      return {
        line1: addressStr.substring(0, bhiwandiIndex).trim(),
        line2: addressStr.substring(bhiwandiIndex).trim()
      };
    } else {
      // Fallback: split at middle if no logical break point
      const midPoint = Math.floor(addressStr.length / 2);
      const lastSpaceBeforeMid = addressStr.lastIndexOf(" ", midPoint);
      if (lastSpaceBeforeMid > 0) {
        return {
          line1: addressStr.substring(0, lastSpaceBeforeMid).trim(),
          line2: addressStr.substring(lastSpaceBeforeMid).trim()
        };
      }
      return {
        line1: addressStr,
        line2: ""
      };
    }
  };

  const formatAddress = (addressObj, pickupAddress, postOfficeComputed) => {
    // Prefer computed post office fields if provided
    if (
      postOfficeComputed &&
      (postOfficeComputed.name ||
        postOfficeComputed.district ||
        postOfficeComputed.state)
    ) {
      const parts = [
        postOfficeComputed.name,
        postOfficeComputed.taluk,
        postOfficeComputed.district,
        postOfficeComputed.division,
        postOfficeComputed.state,
        postOfficeComputed.country,
      ].filter(Boolean);
      const address = parts.join(", ");
      return address || "";
    }

    const parts = [
      pickupAddress,
      addressObj?.locality?.name,
      addressObj?.city?.name,
      addressObj?.state?.name,
      addressObj?.country?.name,
    ].filter(Boolean);

    const address = parts.join(", ");
    const pincode = addressObj?.pincode?.code
      ? ` - ${addressObj.pincode.code}`
      : "";
    return address + pincode || "";
  };

  const fromFull =
    invoice?.consignorAddress ||
    invoice?.pickupAddress ||
    invoice?.fromFullAddress ||
    formatAddress(
      invoice?.fromAddress,
      invoice?.pickupAddress,
      invoice?.fromPostOfficeComputed
    );

  const toFull =
    invoice?.consigneeAddress ||
    invoice?.deliveryAddress ||
    invoice?.toFullAddress ||
    formatAddress(
      invoice?.toAddress,
      invoice?.deliveryAddress,
      invoice?.toPostOfficeComputed
    );

  const signature = invoice?.deliveryProof?.signature;
  const isValidSignature =
    signature &&
    typeof signature === 'string' &&
    signature.trim() !== '' &&
    (signature.startsWith("data:image/png;base64,") ||
      signature.startsWith("data:image/jpeg;base64,") ||
      signature.startsWith("data:image/jpg;base64,") ||
      signature.startsWith("data:image/webp;base64,") ||
      signature.startsWith("data:image/") ||
      signature.startsWith("http://") ||
      signature.startsWith("https://"));

  // Debug logging for signature
  console.log("=== PDF Signature Debug ===");
  console.log("Invoice object keys:", Object.keys(invoice || {}));
  console.log("invoice?.profileSignature:", invoice?.profileSignature);
  console.log("invoice?.profileSignature type:", typeof invoice?.profileSignature);
  console.log("invoice?.profileSignature length:", invoice?.profileSignature?.length);
  console.log("invoice?.dellcubeSignature:", invoice?.dellcubeSignature ? `${invoice.dellcubeSignature.substring(0, 50)}...` : invoice?.dellcubeSignature);
  console.log("invoice?.dellcubeSignature type:", typeof invoice?.dellcubeSignature);
  console.log("invoice?.dellcubeSignature length:", invoice?.dellcubeSignature?.length);

  // profileSignature and dellcubeSignature are base64 strings, not objects
  const companySignatureSource =
    invoice?.profileSignature ||
    invoice?.dellcubeSignature ||
    "";

  console.log("companySignatureSource:", companySignatureSource ? `${companySignatureSource.substring(0, 50)}...` : companySignatureSource);
  console.log("companySignatureSource type:", typeof companySignatureSource);
  console.log("companySignatureSource length:", companySignatureSource?.length);

  // Check if signature is valid (base64 data URI or valid URL)
  const hasCompanySignature =
    typeof companySignatureSource === "string" &&
    companySignatureSource.length > 0 &&
    (companySignatureSource.startsWith("data:image/") ||
      (companySignatureSource.startsWith("http://") ||
        companySignatureSource.startsWith("https://")));

  console.log("hasCompanySignature:", hasCompanySignature);
  console.log("Starts with data:image/:", companySignatureSource?.startsWith("data:image/"));
  console.log("Starts with http:", companySignatureSource?.startsWith("http://") || companySignatureSource?.startsWith("https://"));
  console.log("=== End PDF Signature Debug ===");

  const renderCurrency = (value) =>
    value ? `₹${parseFloat(value).toFixed(2)}` : "";

  const freightCharges = [
    { label: "Rate/Kg", value: invoice?.ratePerKg },
    { label: "Basic", value: invoice?.freightRs },
    { label: "Freight", value: invoice?.freightCharges },
    { label: "A.O.C.", value: invoice?.aoc },
    { label: "Hamali", value: invoice?.hamali },
    { label: "D.D.", value: invoice?.ddCharges },
    { label: "St. Ch.", value: invoice?.stCharges },
    { label: "Service", value: invoice?.serviceCharge },
    { label: "Paid", value: invoice?.paid },
    { label: "To Pay", value: invoice?.toPay },
    { label: "T.B.B.", value: invoice?.tbb },
  ];

  const isLandscape = variant === "landscape";

  return (
    <View style={[styles.docketCopy, containerStyle]}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoSection}>
          {logoBase64 ? (
            <Image src={logoBase64} style={styles.companyLogo} />
          ) : (
            <Text style={{ fontSize: 6 }}>LOGO</Text>
          )}
        </View>

        <View style={styles.companySection}>
          <Text
            style={[
              styles.companyName,
              isLandscape && { fontSize: 13 },
            ]}
          >
            {invoice?.company?.name ||
              "DELLCUBE INTEGRATED SOLUTIONS PVT. LTD."}
          </Text>
          {(() => {
            const addressLines = formatAddressTwoLines(invoice?.company?.address);
            return (
              <>
          <Text style={styles.companyAddress}>
                  {addressLines.line1}
          </Text>
                {addressLines.line2 && (
                  <Text style={styles.companyAddress}>
                    {addressLines.line2}
                  </Text>
                )}
              </>
            );
          })()}
          <Text
            style={[
              styles.companyContact,
              isLandscape && { fontSize: 8 },
            ]}
          >
            Ph: {invoice?.company?.contactPhone || "02522-280222"} | Website:{" "}
            {invoice?.company?.website || "www.dellcube.com"} | Email:{" "}
            {invoice?.company?.email || "info@dellcube.com"}
          </Text>
          
          <Text
            style={[
              styles.companyContact,
              isLandscape && { fontSize: 8 },
            ]}
          >
          GSTIN: {invoice?.company?.gstNumber || ""} | PAN: {invoice?.company?.pan || ""}
          </Text>
        </View>

        <View style={styles.copyTypeSection}>
          <Text style={styles.copyType}>{copyType}</Text>
          <Text style={styles.docketNumber}>
            {invoice?.docketNumber || ""}
          </Text>
          <Text style={styles.dateInHeader}>
            Date: {formatDateWithOrdinal(invoice?.invoiceDate || invoice?.createdAt)}
          </Text>
        </View>
      </View>

      {/* Risk Notice Container */}
      <View style={styles.riskContainer}>
        <Text style={styles.riskTitle}>⚠️ AT OWNER'S RISK ⚠️</Text>
        <Text style={styles.riskNote}>
          The company shall not be responsible for any loss, damage, or delay of
          goods during transit. All goods are transported at the owner's risk
          and expense. Insurance coverage is the responsibility of the
          consignor.
        </Text>
      </View>

      {/* Delivery Container - Separate Container */}
      <View style={styles.deliveryContainer}>
        <View style={styles.deliverySection}>
          <View style={styles.deliveryColumn}>
            <Text style={styles.deliveryLabel}>CONSIGNOR:</Text>
            <View style={styles.deliveryInput}>
              <Text style={styles.deliveryInputText}>{invoice?.consignor || ""}</Text>
            </View>
            <Text style={styles.deliveryLabel}>CONSIGNEE:</Text>
            <View style={styles.deliveryInput}>
              <Text style={styles.deliveryInputText}>{invoice?.consignee || ""}</Text>
            </View>
          </View>
          <View style={styles.deliveryColumn}>
            <Text style={styles.deliveryLabel}>FROM:</Text>
            <View style={styles.deliveryInput}>
              <Text style={styles.deliveryInputText}>{fromFull}</Text>
            </View>
            <Text style={styles.deliveryLabel}>TO:</Text>
            <View style={styles.deliveryInput}>
              <Text style={styles.deliveryInputText}>{toFull}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {/* Left Column - Vehicle and Goods Table */}
        <View style={styles.leftColumn}>
          <View
            style={[
              styles.mainTable,
              isLandscape && styles.mainTableLandscape,
            ]}
          >
            <View style={styles.tableHeader}>
              <Text
                style={[
                  styles.tableHeaderCell,
                  isLandscape && styles.tableHeaderCellLandscape,
                  { width: "30%" },
                ]}
              >
                VEHICLE DETAILS
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  isLandscape && styles.tableHeaderCellLandscape,
                  { width: "20%" },
                ]}
              >
                QTY
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  isLandscape && styles.tableHeaderCellLandscape,
                  { width: "30%" },
                ]}
              >
                GOODS DESCRIPTION
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  isLandscape && styles.tableHeaderCellLandscape,
                  { width: "20%", borderRight: "none" },
                ]}
              >
                WEIGHT
              </Text>
            </View>

            {/* Vehicle Number Row */}
            <View
              style={[
                styles.tableRow,
                isLandscape && styles.tableRowLandscape,
              ]}
            >
              <View style={[styles.tableCell, { width: "30%" }]}>
                <Text style={styles.fieldLabel}>VEHICLE NUMBER:</Text>
                <FieldInputView landscape={isLandscape}
                  value={
                    invoice?.vehicle?.vehicleNumber ||
                    invoice?.vendorVehicle?.vehicleNumber ||
                    ""
                  }
                />
              </View>
              <View style={[styles.tableCell, { width: "20%" }]}>
                {/* <Text style={styles.fieldLabel}>QTY:</Text> */}
                <FieldInputView landscape={isLandscape} value={invoice?.numberOfPackages || ""} />
              </View>
              <View style={[styles.tableCell, { width: "30%" }]}>
                {/* <Text style={styles.fieldLabel}>GOODS:</Text> */}
                <FieldInputView landscape={isLandscape}
                  value={`${invoice?.goodsType?.name || ""}`}
                />
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "20%", borderRight: "none" },
                ]}
              >
                {/* <Text style={styles.fieldLabel}>WEIGHT:</Text> */}
                <FieldInputView landscape={isLandscape}
                  value={
                    invoice?.totalWeight ? `${invoice.totalWeight} kg` : ""
                  }
                />
              </View>
            </View>

            {/* Vehicle Type Row */}
            <View
              style={[
                styles.tableRow,
                isLandscape && styles.tableRowLandscape,
              ]}
            >
              <View style={[styles.tableCell, { width: "30%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  VEHICLE TYPE:
                </Text>
                <FieldInputView landscape={isLandscape} value={invoice?.vehicleSize || ""} />
              </View>
              <View style={[styles.tableCell, { width: "20%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  INV NO:
                </Text>
                <FieldInputView landscape={isLandscape} value={renderMultiValue(invoice?.invoiceNumber)} />
              </View>
              <View style={[styles.tableCell, { width: "30%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  INVOICE VALUE:
                </Text>
                <FieldInputView landscape={isLandscape}
                  value={renderCurrency(
                    invoice?.invoiceBill ||
                      invoice?.total ||
                      invoice?.invoiceValue
                  )}
                />
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "20%", borderRight: "none" },
                ]}
              >
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  E-WAY BILL:
                </Text>
                <FieldInputView landscape={isLandscape}
                  value={renderMultiValue(
                    invoice?.ewayBillNo || invoice?.wayBillNo
                  )}
                />
              </View>
            </View>

            {/* Driver Row */}
            <View
              style={[
                styles.tableRow,
                isLandscape && styles.tableRowLandscape,
              ]}
            >
              <View style={[styles.tableCell, { width: "30%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  DRIVER NAME:
                </Text>
                <FieldInputView landscape={isLandscape} value={invoice?.driver?.name || ""} />
              </View>
              <View style={[styles.tableCell, { width: "20%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  SITE ID:
                </Text>
                <FieldInputView landscape={isLandscape} value={invoice?.siteId || ""} />
              </View>
              <View style={[styles.tableCell, { width: "30%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  SITE TYPE:
                </Text>
                <FieldInputView landscape={isLandscape} value={invoice?.siteType?.name || ""} />
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "20%", borderRight: "none" },
                ]}
              >
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  ORDER:
                </Text>
                <FieldInputView landscape={isLandscape} value={invoice?.orderNumber || ""} />
              </View>
            </View>

            {/* Driver Contact Row */}
            <View
              style={[
                styles.tableRow,
                isLandscape && styles.tableRowLandscape,
              ]}
            >
              <View style={[styles.tableCell, { width: "30%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  DRIVER PHONE:
                </Text>
                <FieldInputView landscape={isLandscape} value={invoice?.driverContactNumber || ""} />
              </View>
              <View style={[styles.tableCell, { width: "20%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  SEAL NO:
                </Text>
                <FieldInputView landscape={isLandscape} value={invoice?.sealNo || ""} />
              </View>
              <View style={[styles.tableCell, { width: "30%" }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    isLandscape && styles.fieldLabelLandscape,
                  ]}
                >
                  TRANSPORT MODE:
                </Text>
                <FieldInputView landscape={isLandscape} value={invoice?.transportMode?.name || ""} />
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "20%", borderRight: "none" },
                ]}
              >
                {/* Intentionally left blank to keep grid alignment after removing PAYMENT column */}
              </View>
            </View>
          </View>
        </View>

        {/* Right Column - Freight Chart */}
        <View style={styles.rightColumn}>
          <View style={styles.freightSection}>
            <Text style={styles.freightHeader}>FREIGHT CHARGES</Text>
            <View style={styles.freightBody}>
              {freightCharges
                .filter((c) => c.label !== "Freight")
                .map((charge, index) => (
                  <View key={index} style={styles.freightRow}>
                    <Text style={styles.freightLabel}>{charge.label}</Text>
                    <Text style={styles.freightValue}>
                      {renderCurrency(charge.value)}
                    </Text>
                  </View>
                ))}
              <View style={[styles.freightTotalRow, styles.freightTotal]}>
                <Text style={[styles.freightLabel, styles.freightTotal]}>
                  TOTAL
                </Text>
                <Text
                  style={[
                    styles.freightValue,
                    styles.freightTotal,
                    { fontWeight: "bold" },
                  ]}
                >
                  {/* {renderCurrency(invoice?)} */}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Footer Section */}
      <View style={styles.footerSection}>
        <View style={styles.receiverSection}>
          <Text style={styles.receiverHeader}>DELIVERY CONFIRMATION</Text>
          {/* Transposed table layout - fields in columns */}
          <View style={styles.receiverTableContainer}>
            {/* Left column - Main fields */}
            <View style={styles.receiverTableLeft}>
              <View style={styles.receiverRow}>
                <Text style={styles.receiverLabel}>Receiver Name:</Text>
                <Text style={styles.receiverValue}>
                  {invoice?.deliveryProof?.receiverName ||
                    invoice?.receiverName ||
                    ""}
                </Text>
              </View>
              <View style={styles.receiverRow}>
                <Text style={styles.receiverLabel}>Mobile No:</Text>
                <Text style={styles.receiverValue}>
                  {invoice?.deliveryProof?.receiverMobile ||
                    invoice?.receiverMobile ||
                    ""}
                </Text>
              </View>
              <View style={styles.receiverRow}>
                <Text style={styles.receiverLabel}>Floor:</Text>
                <Text style={styles.receiverValue}>
                  {invoice?.deliveryProof?.floor || ""}
                </Text>
              </View>
              <View style={styles.receiverRowLast}>
                <Text style={styles.receiverLabel}>Date & Time:</Text>
                <Text style={styles.receiverValue}>
                  {safeFormatDate(
                    invoice?.deliveredAt || invoice?.receiverDateTime,
                    { time: true }
                  )}
                </Text>
              </View>
            </View>
            
            {/* Right column - Remark and Signature */}
            <View style={styles.receiverTableRight}>
              <View style={[styles.receiverRow, { alignItems: "flex-start", minHeight: "4mm", paddingVertical: "0.4mm", borderBottom: "1px solid #000" }]}>
                <Text style={styles.receiverRightLabel}>Remark:</Text>
                <View style={{ width: "65%", paddingLeft: "0.3mm", paddingRight: "0.2mm" }}>
                  <Text style={[styles.receiverRightValue, { width: "100%" }]}>
                    {invoice?.deliveryProof?.remarks?.replace(/\|/g, '') || ""}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: "column", justifyContent: "flex-start", paddingTop: "0.3mm" }}>
                <Text style={{ fontSize: 7, fontWeight: "bold", marginBottom: "0.2mm" }}>
                  Receiver's Signature:
                </Text>
                <View style={styles.signatureBox}>
                  {isValidSignature ? (
                    <Image 
                      src={signature} 
                      style={styles.signatureImg}
                      cache={false}
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.authSection}>
          <Text style={styles.authHeader}>
            FOR:{" "}
            {invoice?.company?.name?.toUpperCase() ||
              "DELLCUBE INTEGRATED SOLUTIONS PVT. LTD."}
          </Text>
          <View style={styles.companySignatureBox}>
            {hasCompanySignature ? (
              <Image
                src={companySignatureSource}
                style={styles.companySignatureImg}
                cache={false}
              />
            ) : (
              <Text style={{ fontSize: 5, color: "#555" }}>
                
              </Text>
            )}
          </View>
          <Text style={styles.authSignatory}>Authorized Signatory</Text>
        </View>
      </View>
    </View>
  );
}

export default function InvoicePDFDocument({ invoice, logoBase64 }) {
  if (!invoice) {
    return (
      <Document>
        <Page>
          <Text>No invoice data provided.</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContainer}>
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="CONSIGNOR COPY"
            variant="portrait"
          />
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="CONSIGNEE COPY"
            variant="portrait"
          />
        </View>
      </Page>
      {/* Additional page for Driver and Office copies */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContainer}>
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="DRIVER COPY"
            variant="portrait"
          />
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="OFFICE COPY"
            variant="portrait"
          />
        </View>
      </Page>
    </Document>
  );
}

// Landscape version: one docket per page, 4 copies
export function InvoicePDFDocumentLandscape({ invoice, logoBase64 }) {
  if (!invoice) {
    return (
      <Document>
        <Page orientation="landscape">
          <Text>No invoice data provided.</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={[styles.page, styles.landscapePage]}
      >
        <View
          style={[styles.pageContainer, styles.landscapePageContainer]}
        >
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="CONSIGNOR COPY"
            containerStyle={styles.landscapeDocketCopy}
            variant="landscape"
          />
        </View>
      </Page>
      <Page
        size="A4"
        orientation="landscape"
        style={[styles.page, styles.landscapePage]}
      >
        <View
          style={[styles.pageContainer, styles.landscapePageContainer]}
        >
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="CONSIGNEE COPY"
            containerStyle={styles.landscapeDocketCopy}
            variant="landscape"
          />
        </View>
      </Page>
      <Page
        size="A4"
        orientation="landscape"
        style={[styles.page, styles.landscapePage]}
      >
        <View
          style={[styles.pageContainer, styles.landscapePageContainer]}
        >
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="DRIVER COPY"
            containerStyle={styles.landscapeDocketCopy}
            variant="landscape"
          />
        </View>
      </Page>
      <Page
        size="A4"
        orientation="landscape"
        style={[styles.page, styles.landscapePage]}
      >
        <View
          style={[styles.pageContainer, styles.landscapePageContainer]}
        >
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="OFFICE COPY"
            containerStyle={styles.landscapeDocketCopy}
            variant="landscape"
          />
        </View>
      </Page>
    </Document>
  );
}
