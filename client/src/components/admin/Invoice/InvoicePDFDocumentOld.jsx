import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    fontFamily: 'Helvetica',
  },
  pageContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    padding: '3mm',
    gap: '2mm',
  },
  docketCopy: {
    backgroundColor: '#fff',
    border: '2px solid #000',
    width: '100%',
    height: '48%',
    padding: '2mm',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    fontSize: 8,
  },
  
  // Header Section
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: '1.5mm',
    borderBottom: '1px solid #000',
    paddingBottom: '1mm',
  },
  logoSection: {
    width: '15%',
    alignItems: 'center',
  },
  companyLogo: {
    width: 45,
    height: 35,
  },
  companySection: {
    width: '70%',
    alignItems: 'center',
    paddingHorizontal: '2mm',
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '0.5mm',
    textTransform: 'uppercase',
  },
  companyAddress: {
    fontSize: 7,
    textAlign: 'center',
    lineHeight: 1.2,
    marginBottom: '0.3mm',
  },
  companyContact: {
    fontSize: 6,
    textAlign: 'center',
    lineHeight: 1.1,
  },
  copyTypeSection: {
    width: '15%',
    alignItems: 'center',
  },
  copyType: {
    fontSize: 8,
    fontWeight: 'bold',
    border: '1px solid #000',
    padding: '1mm',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
  },
  docketNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    border: '2px solid #000',
    padding: '1mm',
    textAlign: 'center',
    marginTop: '1mm',
    backgroundColor: '#fff',
    letterSpacing: 1,
  },

  // Company Details Row
  companyDetailsRow: {
    flexDirection: 'row',
    marginBottom: '1mm',
  },
  companyDetailBox: {
    width: '50%',
    border: '1px solid #000',
    padding: '1mm',
    fontSize: 7,
    fontWeight: 'bold',
  },

  // Main Content Area
  contentArea: {
    flex: 1,
    flexDirection: 'row',
    gap: '1mm',
  },
  leftColumn: {
    width: '60%',
    flexDirection: 'column',
    gap: '1mm',
  },
  rightColumn: {
    width: '40%',
    flexDirection: 'column',
    gap: '1mm',
  },

  // Party Details Section
  partySection: {
    border: '1px solid #000',
    fontSize: 7,
  },
  partySectionHeader: {
    backgroundColor: '#e8e8e8',
    padding: '0.8mm',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottom: '1px solid #000',
  },
  partyRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
  },
  partyLabel: {
    width: '30%',
    backgroundColor: '#f5f5f5',
    padding: '0.8mm',
    fontSize: 6,
    fontWeight: 'bold',
    borderRight: '1px solid #000',
  },
  partyValue: {
    width: '70%',
    padding: '0.8mm',
    fontSize: 6,
    minHeight: '3mm',
  },

  // Goods Details Section
  goodsSection: {
    border: '1px solid #000',
    fontSize: 7,
  },
  goodsHeader: {
    backgroundColor: '#e8e8e8',
    padding: '0.8mm',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottom: '1px solid #000',
  },
  goodsTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #000',
  },
  goodsHeaderCell: {
    padding: '0.8mm',
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRight: '1px solid #000',
  },
  goodsRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
  },
  goodsCell: {
    padding: '0.8mm',
    fontSize: 6,
    borderRight: '1px solid #000',
    textAlign: 'center',
    minHeight: '4mm',
  },

  // Vehicle Details Section (Right Column)
  vehicleSection: {
    border: '1px solid #000',
    fontSize: 7,
  },
  vehicleSectionHeader: {
    backgroundColor: '#e8e8e8',
    padding: '0.8mm',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottom: '1px solid #000',
  },
  vehicleRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
  },
  vehicleLabel: {
    width: '45%',
    backgroundColor: '#f5f5f5',
    padding: '0.8mm',
    fontSize: 6,
    fontWeight: 'bold',
    borderRight: '1px solid #000',
  },
  vehicleValue: {
    width: '55%',
    padding: '0.8mm',
    fontSize: 6,
  },

  // Freight Charges Section
  freightSection: {
    border: '1px solid #000',
    fontSize: 7,
  },
  freightHeader: {
    backgroundColor: '#e8e8e8',
    padding: '0.8mm',
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottom: '1px solid #000',
  },
  freightTable: {
    flexDirection: 'column',
  },
  freightTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #000',
  },
  freightHeaderCell: {
    width: '50%',
    padding: '0.5mm',
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRight: '1px solid #000',
  },
  freightRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
  },
  freightLabel: {
    width: '50%',
    padding: '0.5mm',
    fontSize: 6,
    borderRight: '1px solid #000',
    fontWeight: 'bold',
    backgroundColor: '#f8f8f8',
  },
  freightValue: {
    width: '50%',
    padding: '0.5mm',
    fontSize: 6,
    textAlign: 'right',
  },
  freightTotal: {
    backgroundColor: '#e8e8e8',
    fontWeight: 'bold',
  },

  // Footer Section
  footerSection: {
    flexDirection: 'row',
    marginTop: '1mm',
    borderTop: '1px solid #000',
    paddingTop: '1mm',
    gap: '2mm',
  },
  receiverSection: {
    width: '65%',
    border: '1px solid #000',
    padding: '1mm',
    fontSize: 6,
  },
  receiverHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: '0.5mm',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    padding: '0.5mm',
  },
  receiverRow: {
    flexDirection: 'row',
    marginBottom: '0.5mm',
  },
  receiverLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    width: '35%',
  },
  receiverValue: {
    fontSize: 6,
    width: '65%',
  },
  signatureBox: {
    width: '100%',
    height: '8mm',
    border: '1px solid #000',
    marginTop: '1mm',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 6,
    backgroundColor: '#f9f9f9',
  },
  signatureImg: {
    maxWidth: '95%',
    maxHeight: '7mm',
  },
  authSection: {
    width: '33%',
    border: '1px solid #000',
    padding: '1mm',
    textAlign: 'center',
    fontSize: 6,
    justifyContent: 'space-between',
  },
  authHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: '2mm',
  },
  authSignatory: {
    fontSize: 6,
    marginTop: 'auto',
    paddingTop: '4mm',
  },

  // Risk Notice
  riskNotice: {
    backgroundColor: '#ffe6e6',
    border: '1px solid #ff0000',
    padding: '1mm',
    fontSize: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#cc0000',
  },
});

function InvoiceCopy({ invoice, logoBase64, copyType }) {
  const safeFormatDate = (dateString, options = { time: false }) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    if (options.time) {
      return date.toLocaleString('en-IN');
    }
    return date.toLocaleDateString('en-IN');
  };

  const formatAddress = (addressObj, pickupAddress) => {
    const parts = [
      pickupAddress,
      addressObj?.locality?.name,
      addressObj?.city?.name,
      addressObj?.state?.name,
      addressObj?.country?.name,
    ].filter(Boolean);
    
    const address = parts.join(', ');
    const pincode = addressObj?.pincode?.code ? ` - ${addressObj.pincode.code}` : '';
    return address + pincode || '-';
  };

  const fromFull = formatAddress(invoice?.fromAddress, invoice?.pickupAddress);
  const toFull = formatAddress(invoice?.toAddress, invoice?.deliveryAddress);

  const signature = invoice?.deliveryProof?.signature;
  const isValidSignature = signature && 
    (signature.startsWith('data:image/png;base64,') || signature.startsWith('data:image/jpeg;base64,'));

  const renderCurrency = (value) => value ? `₹${parseFloat(value).toFixed(2)}` : '-';

  const freightCharges = [
    { label: 'Rate/Kg', value: invoice?.ratePerKg },
    { label: 'Basic', value: invoice?.freightRs },
    { label: 'Freight', value: invoice?.freightCharges },
    { label: 'A.O.C.', value: invoice?.aoc },
    { label: 'Hamali', value: invoice?.hamali },
    { label: 'D.D.', value: invoice?.ddCharges },
    { label: 'St. Ch.', value: invoice?.stCharges },
    { label: 'Service', value: invoice?.serviceCharge },
    { label: 'Paid', value: invoice?.paid },
    { label: 'To Pay', value: invoice?.toPay },
    { label: 'T.B.B.', value: invoice?.tbb },
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
            {invoice?.company?.name || 'DELLCUBE INTEGRATED SOLUTIONS PVT. LTD.'}
          </Text>
          <Text style={styles.companyAddress}>
            {invoice?.company?.address || 'Babosa Industrial Park, Bldg. No. A-4, Gr. Floor, Unit No. 10, Saravali Village, Bhiwandi - 421 302, Dist. Thane.'}
          </Text>
          <Text style={styles.companyContact}>
            Ph: {invoice?.company?.contactPhone || '02522-280222'} | 
            Website: {invoice?.company?.website || 'www.dellcube.com'} | 
            Email: {invoice?.company?.email || 'info@dellcube.com'}
          </Text>
        </View>
        
        <View style={styles.copyTypeSection}>
          <Text style={styles.copyType}>{copyType}</Text>
          <Text style={styles.docketNumber}>{invoice?.docketNumber || '-'}</Text>
        </View>
      </View>

      {/* Company Details Row */}
      <View style={styles.companyDetailsRow}>
        <Text style={styles.companyDetailBox}>
          GSTIN: {invoice?.company?.gstNumber || '-'}
        </Text>
        <Text style={styles.companyDetailBox}>
          PAN: {invoice?.company?.pan || '-'} | Date: {safeFormatDate(invoice?.invoiceDate || invoice?.createdAt)}
        </Text>
      </View>

      {/* Risk Notice */}
      <View style={styles.riskNotice}>
        <Text>⚠️ GOODS CARRIED AT OWNER'S RISK - NO LIABILITY FOR LOSS OR DAMAGE ⚠️</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentArea}>
        {/* Left Column */}
        <View style={styles.leftColumn}>
          {/* Party Details */}
          <View style={styles.partySection}>
            <Text style={styles.partySectionHeader}>CONSIGNMENT DETAILS</Text>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Consignor:</Text>
              <Text style={styles.partyValue}>{invoice?.consignor || '-'}</Text>
            </View>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Consignee:</Text>
              <Text style={styles.partyValue}>{invoice?.consignee || '-'}</Text>
            </View>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>From:</Text>
              <Text style={styles.partyValue}>{fromFull}</Text>
            </View>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>To:</Text>
              <Text style={styles.partyValue}>{toFull}</Text>
            </View>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Order No:</Text>
              <Text style={styles.partyValue}>{invoice?.orderNumber || '-'}</Text>
            </View>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>E-Way Bill:</Text>
              <Text style={styles.partyValue}>{invoice?.ewayBillNo || invoice?.wayBillNo || '-'}</Text>
            </View>
          </View>

          {/* Goods Details */}
          <View style={styles.goodsSection}>
            <Text style={styles.goodsHeader}>GOODS DESCRIPTION</Text>
            <View style={styles.goodsTableHeader}>
              <Text style={[styles.goodsHeaderCell, { width: '15%' }]}>QTY</Text>
              <Text style={[styles.goodsHeaderCell, { width: '50%' }]}>DESCRIPTION</Text>
              <Text style={[styles.goodsHeaderCell, { width: '20%' }]}>WEIGHT</Text>
              <Text style={[styles.goodsHeaderCell, { width: '15%', borderRight: 'none' }]}>VALUE</Text>
            </View>
            <View style={styles.goodsRow}>
              <Text style={[styles.goodsCell, { width: '15%' }]}>
                {invoice?.numberOfPackages || '-'}
              </Text>
              <Text style={[styles.goodsCell, { width: '50%', textAlign: 'left' }]}>
                {`${invoice?.goodsType?.name || '-'} ${
                  invoice?.goodsType?.items?.length 
                    ? '(' + invoice.goodsType.items.join(', ') + ')' 
                    : ''
                }`}
              </Text>
              <Text style={[styles.goodsCell, { width: '20%' }]}>
                {invoice?.totalWeight ? `${invoice.totalWeight} kg` : '-'}
              </Text>
              <Text style={[styles.goodsCell, { width: '15%', borderRight: 'none' }]}>
                {renderCurrency(invoice?.goodsValue)}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Column */}
        <View style={styles.rightColumn}>
          {/* Vehicle Details */}
          <View style={styles.vehicleSection}>
            <Text style={styles.vehicleSectionHeader}>VEHICLE & DRIVER DETAILS</Text>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>Vehicle No:</Text>
              <Text style={styles.vehicleValue}>
                {invoice?.vehicle?.vehicleNumber || invoice?.vendorVehicle?.vehicleNumber || '-'}
              </Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>Vehicle Type:</Text>
              <Text style={styles.vehicleValue}>{invoice?.vehicleType || '-'}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>Vehicle Size:</Text>
              <Text style={styles.vehicleValue}>{invoice?.vehicleSize || '-'}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>Driver:</Text>
              <Text style={styles.vehicleValue}>{invoice?.driver?.name || '-'}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>Driver Contact:</Text>
              <Text style={styles.vehicleValue}>{invoice?.driverContactNumber || '-'}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>Vendor:</Text>
              <Text style={styles.vehicleValue}>{invoice?.vendor?.name || '-'}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>Site ID:</Text>
              <Text style={styles.vehicleValue}>{invoice?.siteId || '-'}</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Text style={styles.vehicleLabel}>Payment:</Text>
              <Text style={styles.vehicleValue}>{invoice?.paymentType || '-'}</Text>
            </View>
          </View>

          {/* Freight Charges */}
          <View style={styles.freightSection}>
            <Text style={styles.freightHeader}>FREIGHT CHARGES</Text>
            <View style={styles.freightTable}>
              <View style={styles.freightTableHeader}>
                <Text style={styles.freightHeaderCell}>Particulars</Text>
                <Text style={[styles.freightHeaderCell, { borderRight: 'none' }]}>Amount</Text>
              </View>
              {freightCharges.map((charge, index) => (
                <View key={index} style={styles.freightRow}>
                  <Text style={styles.freightLabel}>{charge.label}</Text>
                  <Text style={styles.freightValue}>{renderCurrency(charge.value)}</Text>
                </View>
              ))}
              <View style={[styles.freightRow, styles.freightTotal]}>
                <Text style={[styles.freightLabel, styles.freightTotal]}>TOTAL</Text>
                <Text style={[styles.freightValue, styles.freightTotal, { fontWeight: 'bold' }]}>
                  {renderCurrency(invoice?.total)}
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
          <View style={styles.receiverRow}>
            <Text style={styles.receiverLabel}>Receiver Name:</Text>
            <Text style={styles.receiverValue}>
              {invoice?.deliveryProof?.receiverName || invoice?.receiverName || '-'}
            </Text>
          </View>
          <View style={styles.receiverRow}>
            <Text style={styles.receiverLabel}>Mobile No:</Text>
            <Text style={styles.receiverValue}>
              {invoice?.deliveryProof?.receiverMobile || invoice?.receiverMobile || '-'}
            </Text>
          </View>
          <View style={styles.receiverRow}>
            <Text style={styles.receiverLabel}>Date & Time:</Text>
            <Text style={styles.receiverValue}>
              {safeFormatDate(invoice?.deliveredAt || invoice?.receiverDateTime, { time: true })}
            </Text>
          </View>
          <Text style={{ fontSize: 6, fontWeight: 'bold', marginTop: '1mm' }}>Receiver's Signature:</Text>
          <View style={styles.signatureBox}>
            {isValidSignature ? (
              <Image src={signature} style={styles.signatureImg} />
            ) : (
              <Text style={{ color: '#666' }}>Signature Required</Text>
            )}
          </View>
        </View>

        <View style={styles.authSection}>
          <Text style={styles.authHeader}>
            FOR: {invoice?.company?.name?.toUpperCase() || 'DELLCUBE INTEGRATED SOLUTIONS PVT. LTD.'}
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
          <InvoiceCopy invoice={invoice} logoBase64={logoBase64} copyType="CONSIGNOR COPY" />
          <InvoiceCopy invoice={invoice} logoBase64={logoBase64} copyType="OFFICE COPY" />
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContainer}>
          <InvoiceCopy invoice={invoice} logoBase64={logoBase64} copyType="CONSIGNEE COPY" />
          <InvoiceCopy invoice={invoice} logoBase64={logoBase64} copyType="DRIVER COPY" />
        </View>
      </Page>
    </Document>
  );
}