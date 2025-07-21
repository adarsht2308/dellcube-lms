import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    fontFamily: 'Helvetica',
    padding: 0,
  },
  pageContainer: {
    width: '100%',
    minHeight: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '5mm',
    gap: 0,
  },
  docketCopy: {
    backgroundColor: '#fff',
    border: '2px solid #000',
    width: '99.2%',
    minHeight: '45%',
    margin: '0 auto',
    padding: 4,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    fontSize: 9,
  },
  docketGap: {
    height: '3mm',
    width: '100%',
    backgroundColor: 'transparent',
  },
  docketHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderBottom: '1px solid #000',
    marginBottom: 2,
    paddingBottom: 2,
  },
  companyLogo: {
    width: 70,
    height: 'auto',
    marginBottom: 1,
  },
  companyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  companyInfo: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 1.1,
  },
  contentSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 2,
    marginBottom: 1,
  },
  infoLeft: {
    width: '58%',
  },
  infoRight: {
    width: '42%',
  },
  table: {
    width: '100%',
    border: '1px solid #000',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
  },
  th: {
    backgroundColor: '#e8e8e8',
    color: '#000',
    fontWeight: 'bold',
    fontSize: 7,
    textAlign: 'center',
    borderRight: '1px solid #000',
    padding: 2,
  },
  td: {
    borderRight: '1px solid #000',
    padding: 2,
    fontSize: 7,
    textAlign: 'left',
  },
  labelCell: {
    fontWeight: 'bold',
    fontSize: 7,
    width: '35%',
    backgroundColor: '#f5f5f5',
    borderRight: '1px solid #000',
    padding: 2,
  },
  valueCell: {
    fontSize: 7,
    backgroundColor: '#fff',
    padding: 2,
    width: '65%',
  },
  sectionHeader: {
    backgroundColor: '#e8e8e8',
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 7,
    padding: 2,
    borderTop: '1px solid #000',
    borderBottom: '1px solid #000',
  },
  signatureBox: {
    width: 80,
    height: 20,
    border: '1px solid #000',
    marginTop: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 6,
  },
  signatureImg: {
    maxWidth: 75,
    maxHeight: 18,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: 8,
    borderTop: '1px solid #000',
    marginTop: 2,
    paddingTop: 2,
    flexGrow: 1,
  },
  footerLeft: {
    width: '48%',
  },
  footerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: 55,
    padding: 10,
    position: 'relative',
    width: '48%',
    alignItems: 'flex-end',
  },
  footerRight: {
    marginTop: 'auto',
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  docketCopyTitle: {
    position: 'absolute',
    top: 2,
    right: 8,
    fontSize: 8,
    fontWeight: 'bold',
    border: '1px solid #000',
    padding: '1px 4px',
    backgroundColor: '#fff',
  },
  docketNumberBox: {
    position: 'absolute',
    top: 15,
    right: 8,
    fontSize: 10,
    fontWeight: 'bold',
    border: '2px solid #000',
    padding: '2px 6px',
    backgroundColor: '#fff',
    letterSpacing: 1,
  },
});

function InvoiceCopy({ invoice, logoBase64, copyType }) {
  const safeFormatDate = (dateString, options = { time: false }) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // The date is invalid
      return '-';
    }
    if (options.time) {
      return date.toLocaleString('en-IN');
    }
    return date.toLocaleDateString('en-IN');
  };

  const fromFull = [
    invoice?.pickupAddress,
    invoice?.fromAddress?.locality?.name,
    invoice?.fromAddress?.city?.name,
    invoice?.fromAddress?.state?.name,
    invoice?.fromAddress?.country?.name,
  ]
    .filter(Boolean)
    .join(', ') +
    (invoice?.fromAddress?.pincode?.code ? ' - ' + invoice?.fromAddress?.pincode?.code : '');
  const toFull = [
    invoice?.deliveryAddress,
    invoice?.toAddress?.locality?.name,
    invoice?.toAddress?.city?.name,
    invoice?.toAddress?.state?.name,
    invoice?.toAddress?.country?.name,
  ]
    .filter(Boolean)
    .join(', ') +
    (invoice?.toAddress?.pincode?.code ? ' - ' + invoice?.toAddress?.pincode?.code : '');
  const signature = invoice?.deliveryProof?.signature;
  const isValidSignature = signature && (signature.startsWith('data:image/png;base64,') || signature.startsWith('data:image/jpeg;base64,'));

  const renderCharge = (value) => value ? `₹${parseFloat(value).toFixed(2)}` : '-';
  const renderValue = (value) => value ? `₹${parseFloat(value).toLocaleString('en-IN')}` : '-';

  return (
    <View style={styles.docketCopy}>
      <Text style={styles.docketCopyTitle}>{copyType}</Text>
      <Text style={styles.docketNumberBox}>{invoice?.docketNumber || '-'}</Text>
      <View style={styles.docketHeader}>
        {logoBase64 && <Image src={logoBase64} style={styles.companyLogo} />}
        <Text style={styles.companyTitle}>{invoice?.company?.name || 'DELLCUBE INTEGRATED SOLUTIONS PVT. LTD.'}</Text>
        <Text style={styles.companyInfo}>
          {invoice?.company?.address || 'Babosa Industrial Park, Bldg. No. A-4, Gr. Floor, Unit No. 10, Saravali Village, Bhiwandi - 421 302, Dist. Thane.'}
        </Text>
        <Text style={styles.companyInfo}>
          Ph: {invoice?.company?.contactPhone || '02522-280222'} | Website: {invoice?.company?.website || 'www.dellcube.com'} | Email: {invoice?.company?.email || 'info@dellcube.com'}
        </Text>
      </View>
      <View style={styles.contentSection}>
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <View style={styles.table}>
              <View style={styles.tableRow}><Text style={styles.labelCell}>GSTIN:</Text><Text style={styles.valueCell}>{invoice?.company?.gstNumber || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>PAN:</Text><Text style={styles.valueCell}>{invoice?.company?.pan || '-'}</Text></View>
              <View style={styles.sectionHeader}><Text>BOOKING PARTICULARS</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Booking Branch</Text><Text style={styles.valueCell}>{invoice?.branch?.name || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Delivery Branch</Text><Text style={styles.valueCell}>{invoice?.toAddress?.city?.name || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Order No.</Text><Text style={styles.valueCell}>{invoice?.orderNumber || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Site ID</Text><Text style={styles.valueCell}>{invoice?.siteId || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Seal No</Text><Text style={styles.valueCell}>{invoice?.sealNo || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Eway Bill No.</Text><Text style={styles.valueCell}>{invoice?.ewayBillNo || invoice?.wayBillNo || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Consignor</Text><Text style={styles.valueCell}>{invoice?.consignor || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Consignee</Text><Text style={styles.valueCell}>{invoice?.consignee || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>From Address</Text><Text style={styles.valueCell}>{fromFull || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>To Address</Text><Text style={styles.valueCell}>{toFull || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Remarks</Text><Text style={styles.valueCell}>{invoice?.remarks || '-'}</Text></View>
            </View>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.table}>
              <View style={styles.sectionHeader}><Text>RISK COVERAGE OF CARGO AT OWNER'S RISK</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Vehicle No.</Text><Text style={styles.valueCell}>{invoice?.vehicle?.vehicleNumber || invoice?.vendorVehicle?.vehicleNumber || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Vehicle Type:</Text><Text style={styles.valueCell}>{invoice?.vehicleType || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Vehicle Size:</Text><Text style={styles.valueCell}>{invoice?.vehicleSize || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Vendor:</Text><Text style={styles.valueCell}>{invoice?.vendor?.name || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Driver:</Text><Text style={styles.valueCell}>{invoice?.driver?.name || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Driver Contact:</Text><Text style={styles.valueCell}>{invoice?.driverContactNumber || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Payment Type:</Text><Text style={styles.valueCell}>{invoice?.paymentType || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Status:</Text><Text style={styles.valueCell}>{invoice?.status || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Site Type:</Text><Text style={styles.valueCell}>{invoice?.siteType?.name || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Transport Mode:</Text><Text style={styles.valueCell}>{invoice?.transportMode?.name || '-'}</Text></View>
              <View style={styles.sectionHeader}><Text>DOCKET NO.</Text></View>
              <View style={styles.tableRow}><Text style={{ ...styles.valueCell, width: '100%', textAlign: 'center', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 }}>{invoice?.docketNumber || '-'}</Text></View>
              <View style={styles.tableRow}><Text style={styles.labelCell}>Date:</Text><Text style={styles.valueCell}>{safeFormatDate(invoice?.invoiceDate || invoice?.createdAt)}</Text></View>
            </View>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.th, width: '8%', borderLeft: 'none' }}>QTY.</Text>
            <Text style={{ ...styles.th, width: '52%' }}>MATERIAL DESCRIPTION (Said to Contain)</Text>
            <Text style={{ ...styles.th, width: '12%' }}>WEIGHT (Kg)</Text>
            <Text style={{ ...styles.th, width: '28%', borderRight: 'none' }}>VALUE (Rs.)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.td, width: '8%', borderBottom: 'none', borderLeft: 'none' }}>{invoice?.numberOfPackages || '-'}</Text>
            <Text style={{ ...styles.td, width: '52%', borderBottom: 'none' }}>{`${invoice?.goodsType?.name || '-'} ${invoice?.goodsType?.items?.length ? '(' + invoice?.goodsType?.items.join(', ') + ')' : ''}`}</Text>
            <Text style={{ ...styles.td, width: '12%', borderBottom: 'none', textAlign: 'center' }}>{invoice?.totalWeight || '-'}</Text>
            <Text style={{ ...styles.td, width: '28%', borderBottom: 'none', borderRight: 'none', textAlign: 'center' }}>{renderValue(invoice?.goodsValue)}</Text>
          </View>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={{...styles.th, width: '8%', borderLeft: 'none'}}>Rate/Kg</Text>
            <Text style={{...styles.th, width: '8%'}}>Basic</Text>
            <Text style={{...styles.th, width: '8%'}}>Freight</Text>
            <Text style={{...styles.th, width: '8%'}}>A.O.C.</Text>
            <Text style={{...styles.th, width: '8%'}}>Hamali</Text>
            <Text style={{...styles.th, width: '8%'}}>D.D. Charges</Text>
            <Text style={{...styles.th, width: '8%'}}>St. Charges</Text>
            <Text style={{...styles.th, width: '8%'}}>Service</Text>
            <Text style={{...styles.th, width: '8%'}}>Paid</Text>
            <Text style={{...styles.th, width: '8%'}}>To Pay</Text>
            <Text style={{...styles.th, width: '8%'}}>T.B.B.</Text>
            <Text style={{...styles.th, width: '12%', borderRight: 'none'}}>Total</Text>
          </View>
          <View style={styles.tableRow}>
             <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none', borderLeft: 'none'}}>{renderCharge(invoice?.ratePerKg)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.freightRs)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.freightCharges)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.aoc)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.hamali)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.ddCharges)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.stCharges)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.serviceCharge)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.paid)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.toPay)}</Text>
            <Text style={{ ...styles.td, width: '8%', textAlign: 'center', borderBottom: 'none'}}>{renderCharge(invoice?.tbb)}</Text>
            <Text style={{ ...styles.td, width: '12%', fontWeight: 'bold', textAlign: 'center', borderBottom: 'none', borderRight: 'none' }}>{renderValue(invoice?.total)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.footerSection}>
        <View style={styles.footerLeft}>
          <Text>Receiver's Name: {invoice?.deliveryProof?.receiverName || invoice?.receiverName || '____________'}</Text>
          <Text>Date/Time: {safeFormatDate(invoice?.deliveredAt || invoice?.receiverDateTime, { time: true })}</Text>
          <Text>Mobile No.: {invoice?.deliveryProof?.receiverMobile || invoice?.receiverMobile || '____________'}</Text>
          <Text style={{ marginTop: 2 }}>Receiver's Signature:</Text>
          <View style={styles.signatureBox}>
            {isValidSignature ? <Image src={signature} style={styles.signatureImg} /> : null}
          </View>
        </View>
        <View style={styles.footerWrapper}>
          <View style={styles.footerRight}>
            <Text>For: {invoice?.company?.name || 'Dellcube Integrated Solutions Pvt. Ltd.'}</Text>
            <Text >Authorized Signatory</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function InvoicePDFDocument({ invoice, logoBase64 }) {
  if (!invoice) {
    return (
      <Document>
        <Page><Text>No invoice data provided.</Text></Page>
      </Document>
    )
  }
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageContainer}>
          <InvoiceCopy invoice={invoice} logoBase64={logoBase64} copyType="CONSIGNOR COPY" />
          <View style={styles.docketGap} />
          <InvoiceCopy invoice={invoice} logoBase64={logoBase64} copyType="OFFICE COPY" />
        </View>
      </Page>
    </Document>
  );
} 