import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// FieldInputView for consistent value display
const FieldInputView = ({ value, style }) => (
  <View
    style={[
      {
        borderWidth: 1,
        borderColor: "#ccc",
        paddingVertical: 1,
        paddingHorizontal: 2,
        minHeight: 12,
        justifyContent: "center",
        backgroundColor: "#f9f9f9",
        alignItems: "center",
        width: "100%",
      },
      style,
    ]}
  >
    <Text style={{ fontSize: 7, textAlign: "center", width: "100%" }}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    fontFamily: "Helvetica",
    padding: 0,
  },
  pageContainer: {
    width: "100%",
    minHeight: "100%",
    flexDirection: "column",
    alignItems: "center",
    padding: "0.3mm",
    gap: "0.3mm",
  },
  docketCopy: {
    backgroundColor: "#fff",
    border: "2px solid #000",
    width: "100%",
    margin: "auto",
    padding: "1.5mm",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    fontSize: 7,
    justifyContent: "flex-start",
  },

  // Header Section
  headerSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: "0.5mm",
    paddingBottom: "0.5mm",
  },
  logoSection: {
    width: "15%",
    alignItems: "center",
  },
  companyLogo: {
    width: 100,
    height: 40,
  },
  companySection: {
    width: "70%",
    alignItems: "center",
    paddingHorizontal: "1mm",
  },
  companyName: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "0.3mm",
    textTransform: "uppercase",
  },
  companyAddress: {
    fontSize: 6,
    textAlign: "center",
    lineHeight: 1.1,
    marginBottom: "0.2mm",
  },
  companyContact: {
    fontSize: 5,
    textAlign: "center",
    lineHeight: 1.0,
  },
  copyTypeSection: {
    width: "15%",
    alignItems: "center",
  },
  copyType: {
    fontSize: 7,
    fontWeight: "bold",
    border: "1px solid #000",
    padding: "0.5mm",
    textAlign: "center",
    backgroundColor: "#f0f0f0",
  },
  docketNumber: {
    fontSize: 6,
    fontWeight: "bold",
    border: "2px solid #000",
    padding: "0.5mm",
    textAlign: "center",
    marginTop: "0.5mm",
    backgroundColor: "#fff",
  },

  // Company Details Row - Updated layout
  companyDetailsRow: {
    flexDirection: "row",
    marginBottom: "0.5mm",
  },
  leftDetails: {
    width: "15%",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.3mm",
  },
  centerDetails: {
    width: "70%",
  },
  rightDetails: {
    width: "15%",
    alignItems: "center",
  },
  panGstText: {
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "left",
  },
  dateText: {
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "left",
  },

  // Risk Notice Container
  riskContainer: {
    backgroundColor: "#f0f0f0",
    border: "1px solid #000",
    padding: "0.5mm",
    fontSize: 6,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: "1mm",
  },
  riskTitle: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: "0.3mm",
  },
  riskNote: {
    fontSize: 5,
    fontWeight: "normal",
    lineHeight: 1.1,
  },

  // Delivery Container - New separate container
  deliveryContainer: {
    border: "1px solid #000",
    padding: "1mm",
    marginBottom: "1mm",
    backgroundColor: "#f9f9f9",
  },
  deliverySection: {
    flexDirection: "row",
    gap: "0.5mm",
  },
  deliveryColumn: {
    width: "50%",
    flexDirection: "column",
    gap: "0.3mm",
  },
  deliveryLabel: {
    fontSize: 6,
    fontWeight: "bold",
    marginBottom: "0.1mm",
  },
  deliveryInput: {
    border: "1px solid #000",
    padding: "0.5mm",
    fontSize: 6,
    minHeight: "3mm",
    backgroundColor: "#fff",
  },

  // Main Content Area
  contentArea: {
    flexDirection: "row",
    gap: "0.5mm",
    marginBottom: "0.5mm",
  },
  leftColumn: {
    width: "75%",
    flexDirection: "column",
    gap: "0.5mm",
  },
  rightColumn: {
    width: "25%",
    flexDirection: "column",
  },

  // Vehicle and Goods Table - Updated structure
  mainTable: {
    border: "1px solid #000",
    fontSize: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottom: "1px solid #000",
  },
  tableHeaderCell: {
    padding: "0.5mm",
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "center",
    borderRight: "1px solid #000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 20,
  },
  tableCell: {
    padding: "0.5mm",
    fontSize: 6,
    borderRight: "1px solid #000",
    minHeight: "3mm",
    alignItems: "center",
    justifyContent: "center",
  },
  tableCellCenter: {
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 5,
    fontWeight: "bold",
    marginBottom: "0.1mm",
    textAlign: "center",
    width: "100%",
  },
  fieldValue: {
    fontSize: 6,
  },

  // Freight Chart Section (Right Column)
  freightSection: {
    border: "1px solid #000",
    fontSize: 6,
  },
  freightHeader: {
    backgroundColor: "#e8e8e8",
    padding: "0.5mm",
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "center",
    borderBottom: "1px solid #000",
  },
  freightRow: {
    flexDirection: "row",
    borderBottom: "1px solid #000",
  },
  freightLabel: {
    width: "60%",
    padding: "0.3mm",
    fontSize: 5,
    borderRight: "1px solid #000",
    fontWeight: "bold",
    backgroundColor: "#f8f8f8",
  },
  freightValue: {
    width: "40%",
    padding: "0.3mm",
    fontSize: 5,
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
    paddingTop: "0.5mm",
    gap: "1mm",
  },
  receiverSection: {
    width: "75%",
    border: "1px solid #000",
    padding: "0.5mm",
    fontSize: 6,
  },
  receiverHeader: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: "0.5mm",
    textAlign: "center",
    backgroundColor: "#f0f0f0",
    padding: "0.3mm",
  },
  receiverRow: {
    flexDirection: "row",
    marginBottom: "0.3mm",
  },
  receiverLabel: {
    fontSize: 6,
    fontWeight: "bold",
    width: "30%",
  },
  receiverValue: {
    fontSize: 6,
    width: "70%",
  },
  signatureBox: {
    maxWidth: 200,
    height: "25",
    border: "1px solid #000",
    marginTop: "0.5mm",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 6,
    backgroundColor: "#f9f9f9",
  },
  signatureImg: {
    width: "auto",
    maxWidth: "100",
    maxHeight: "35",
    height: "auto",
  },
  authSection: {
    width: "25%",
    border: "1px solid #000",
    padding: "0.5mm",
    textAlign: "center",
    fontSize: 6,
    justifyContent: "space-between",
  },
  authHeader: {
    fontSize: 6,
    fontWeight: "bold",
    marginBottom: "1mm",
  },
  authSignatory: {
    fontSize: 6,
    marginTop: "auto",
    paddingTop: "3mm",
  },
});

function InvoiceCopy({ invoice, logoBase64, copyType }) {
  const safeFormatDate = (dateString, options = { time: false }) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    if (options.time) {
      return date.toLocaleString("en-IN");
    }
    return date.toLocaleDateString("en-IN");
  };

  const formatAddress = (addressObj, pickupAddress) => {
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
    return address + pincode || "-";
  };

  const fromFull = formatAddress(invoice?.fromAddress, invoice?.pickupAddress);
  const toFull = formatAddress(invoice?.toAddress, invoice?.deliveryAddress);

  const signature = invoice?.deliveryProof?.signature;
  const isValidSignature =
    signature &&
    (signature.startsWith("data:image/png;base64,") ||
      signature.startsWith("data:image/jpeg;base64,"));

  const renderCurrency = (value) =>
    value ? `₹${parseFloat(value).toFixed(2)}` : "-";

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

  return (
    <View style={styles.docketCopy}>
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
          <Text style={styles.companyName}>
            {invoice?.company?.name ||
              "DELLCUBE INTEGRATED SOLUTIONS PVT. LTD."}
          </Text>
          <Text style={styles.companyAddress}>
            {invoice?.company?.address ||
              "Babosa Industrial Park, Bldg. No. A-4, Gr. Floor, Unit No. 10, Saravali Village, Bhiwandi - 421 302, Dist. Thane."}
          </Text>
          <Text style={styles.companyContact}>
            Ph: {invoice?.company?.contactPhone || "02522-280222"} | Website:{" "}
            {invoice?.company?.website || "www.dellcube.com"} | Email:{" "}
            {invoice?.company?.email || "info@dellcube.com"}
          </Text>
        </View>

        <View style={styles.copyTypeSection}>
          <Text style={styles.copyType}>{copyType}</Text>
          <Text style={styles.docketNumber}>
            {invoice?.docketNumber || "-"}
          </Text>
        </View>
      </View>

      {/* Company Details Row - New Layout */}
      <View style={styles.companyDetailsRow}>
        <View style={styles.leftDetails}>
          <Text style={styles.panGstText}>
            GSTIN: {invoice?.company?.gstNumber || "-"}
          </Text>
          <Text style={styles.panGstText}>
            PAN: {invoice?.company?.pan || "-"}
          </Text>
        </View>
        <View style={styles.centerDetails}></View>
        <View style={styles.rightDetails}>
          <Text style={styles.dateText}>
            Date: {safeFormatDate(invoice?.invoiceDate || invoice?.createdAt)}
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
              <Text>{invoice?.consignor || "-"}</Text>
            </View>
            <Text style={styles.deliveryLabel}>CONSIGNEE:</Text>
            <View style={styles.deliveryInput}>
              <Text>{invoice?.consignee || "-"}</Text>
            </View>
          </View>
          <View style={styles.deliveryColumn}>
            <Text style={styles.deliveryLabel}>FROM:</Text>
            <View style={styles.deliveryInput}>
              <Text>{fromFull}</Text>
            </View>
            <Text style={styles.deliveryLabel}>TO:</Text>
            <View style={styles.deliveryInput}>
              <Text>{toFull}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {/* Left Column - Vehicle and Goods Table */}
        <View style={styles.leftColumn}>
          <View style={styles.mainTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                VEHICLE DETAILS
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                QTY
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "40%" }]}>
                GOODS DESCRIPTION
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                WEIGHT
              </Text>
              <Text
                style={[
                  styles.tableHeaderCell,
                  { width: "10%", borderRight: "none" },
                ]}
              >
                VALUE
              </Text>
            </View>

            {/* Vehicle Number Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { width: "25%" }]}>
                <Text style={styles.fieldLabel}>VEHICLE NUMBER:</Text>
                <FieldInputView
                  value={
                    invoice?.vehicle?.vehicleNumber ||
                    invoice?.vendorVehicle?.vehicleNumber ||
                    "-"
                  }
                />
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                {/* <Text style={styles.fieldLabel}>QTY:</Text> */}
                <FieldInputView value={invoice?.numberOfPackages || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "40%" }]}>
                {/* <Text style={styles.fieldLabel}>GOODS:</Text> */}
                <FieldInputView
                  value={`${invoice?.goodsType?.name || "-"} ${
                    invoice?.goodsType?.items?.length
                      ? "(" + invoice.goodsType.items.join(", ") + ")"
                      : ""
                  }`}
                />
              </View>
              <View style={[styles.tableCell, { width: "15%" }]}>
                {/* <Text style={styles.fieldLabel}>WEIGHT:</Text> */}
                <FieldInputView
                  value={
                    invoice?.totalWeight ? `${invoice.totalWeight} kg` : "-"
                  }
                />
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "10%", borderRight: "none" },
                ]}
              >
                {/* <Text style={styles.fieldLabel}>VALUE:</Text> */}
                <FieldInputView value={renderCurrency(invoice?.goodsValue)} />
              </View>
            </View>

            {/* Vehicle Type Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { width: "25%" }]}>
                <Text style={styles.fieldLabel}>VEHICLE TYPE:</Text>
                <FieldInputView value={invoice?.vehicleSize || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text style={styles.fieldLabel}>INV NO:</Text>
                <FieldInputView value={invoice?.invoiceNumber || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "40%" }]}>
                <Text style={styles.fieldLabel}>INVOICE VALUE:</Text>
                <FieldInputView value={renderCurrency(invoice?.invoiceBill)} />
              </View>
              <View style={[styles.tableCell, { width: "15%" }]}>
                <Text style={styles.fieldLabel}>E-WAY BILL:</Text>
                <FieldInputView
                  value={invoice?.ewayBillNo || invoice?.wayBillNo || "-"}
                />
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "10%", borderRight: "none" },
                ]}
              />
            </View>

            {/* Driver Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { width: "25%" }]}>
                <Text style={styles.fieldLabel}>DRIVER NAME:</Text>
                <FieldInputView value={invoice?.driver?.name || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text style={styles.fieldLabel}>SITE ID:</Text>
                <FieldInputView value={invoice?.siteId || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "40%" }]}>
                <Text style={styles.fieldLabel}>SITE TYPE:</Text>
                <FieldInputView value={invoice?.siteType?.name || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "15%" }]}>
                <Text style={styles.fieldLabel}>ORDER:</Text>
                <FieldInputView value={invoice?.orderNumber || "-"} />
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "10%", borderRight: "none" },
                ]}
              >
                <Text style={styles.fieldLabel}>PAYMENT:</Text>
                <FieldInputView value={invoice?.paymentType || "-"} />
              </View>
            </View>

            {/* Driver Contact Row */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { width: "25%" }]}>
                <Text style={styles.fieldLabel}>DRIVER PHONE:</Text>
                <FieldInputView value={invoice?.driverContactNumber || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text style={styles.fieldLabel}>SEAL NO:</Text>
                <FieldInputView value={invoice?.sealNo || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "40%" }]}>
                <Text style={styles.fieldLabel}>TRANSPORT MODE:</Text>
                <FieldInputView value={invoice?.transportMode?.name || "-"} />
              </View>
              <View style={[styles.tableCell, { width: "15%" }]}>
                <Text style={styles.fieldLabel}>STATUS:</Text>
                <FieldInputView value={invoice?.status || "-"} />
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "10%", borderRight: "none" },
                ]}
              >
                {/* <Text style={styles.fieldLabel}>DISPATCHED AT:</Text>
                <FieldInputView
                  value={
                    invoice?.dispatchDateTime
                      ? new Date(invoice.dispatchDateTime).toLocaleString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "-"
                  }
                /> */}
              </View>
            </View>
          </View>
        </View>

        {/* Right Column - Freight Chart */}
        <View style={styles.rightColumn}>
          <View style={styles.freightSection}>
            <Text style={styles.freightHeader}>FREIGHT CHARGES</Text>
            {freightCharges.map((charge, index) => (
              <View key={index} style={styles.freightRow}>
                <Text style={styles.freightLabel}>{charge.label}</Text>
                <Text style={styles.freightValue}>
                  {renderCurrency(charge.value)}
                </Text>
              </View>
            ))}
            <View style={[styles.freightRow, styles.freightTotal]}>
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
                {renderCurrency(invoice?.total)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer Section */}
      <View style={styles.footerSection}>
        <View style={styles.receiverSection}>
          <Text style={styles.receiverHeader}>DELIVERY CONFIRMATION</Text>
          <View style={styles.receiverRow}>
            <Text style={styles.receiverLabel}>Receiver Name:</Text>
            <Text style={styles.receiverValue}>
              {invoice?.deliveryProof?.receiverName ||
                invoice?.receiverName ||
                "-"}
            </Text>
          </View>
          <View style={styles.receiverRow}>
            <Text style={styles.receiverLabel}>Mobile No:</Text>
            <Text style={styles.receiverValue}>
              {invoice?.deliveryProof?.receiverMobile ||
                invoice?.receiverMobile ||
                "-"}
            </Text>
          </View>
          <View style={styles.receiverRow}>
            <Text style={styles.receiverLabel}>Date & Time:</Text>
            <Text style={styles.receiverValue}>
              {safeFormatDate(
                invoice?.deliveredAt || invoice?.receiverDateTime,
                { time: true }
              )}
            </Text>
          </View>
          <View style={styles.receiverRow}>
            <Text style={styles.receiverLabel}>Remark:</Text>
            <Text style={styles.receiverValue}>{invoice?.deliveryProof?.remarks}</Text>
          </View>
          <Text style={{ fontSize: 6, fontWeight: "bold", marginTop: "1mm" }}>
            Receiver's Signature:
          </Text>
          <View style={styles.signatureBox}>
            {isValidSignature ? (
              <Image src={signature} style={styles.signatureImg} />
            ) : (
              <Text style={{ color: "#666" }}>Signature Required</Text>
            )}
          </View>
        </View>

        <View style={styles.authSection}>
          <Text style={styles.authHeader}>
            FOR:{" "}
            {invoice?.company?.name?.toUpperCase() ||
              "DELLCUBE INTEGRATED SOLUTIONS PVT. LTD."}
          </Text>
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
          />
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="OFFICE COPY"
          />
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContainer}>
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="CONSIGNEE COPY"
          />
          <InvoiceCopy
            invoice={invoice}
            logoBase64={logoBase64}
            copyType="DRIVER COPY"
          />
        </View>
      </Page>
    </Document>
  );
}
