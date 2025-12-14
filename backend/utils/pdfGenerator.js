const React = require('react');
const { Document, Page, Text, View, StyleSheet, Image } = require('@react-pdf/renderer');
const ReactPDF = require('@react-pdf/renderer');

// Create styles matching the Axonic Motorworks template
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottom: '2 solid #000',
        paddingBottom: 10,
    },
    logoSection: {
        width: '30%',
    },
    logo: {
        width: 80,
        height: 80,
    },
    headerInfo: {
        width: '40%',
        paddingLeft: 10,
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    companyDetails: {
        fontSize: 8,
        lineHeight: 1.4,
    },
    workOrderSection: {
        width: '30%',
        alignItems: 'flex-end',
    },
    workOrderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    workOrderBox: {
        backgroundColor: '#4472C4',
        color: 'white',
        padding: 5,
        marginBottom: 5,
        width: '100%',
        textAlign: 'center',
    },
    workOrderNumber: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateBox: {
        backgroundColor: '#4472C4',
        color: 'white',
        padding: 5,
        width: '100%',
        textAlign: 'center',
    },
    sectionTitle: {
        backgroundColor: '#4472C4',
        color: 'white',
        padding: 5,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    table: {
        display: 'table',
        width: '100%',
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1 solid #ccc',
    },
    tableHeader: {
        backgroundColor: '#4472C4',
        color: 'white',
        fontWeight: 'bold',
    },
    tableCol: {
        padding: 5,
        fontSize: 9,
    },
    col20: { width: '20%' },
    col25: { width: '25%' },
    col30: { width: '30%' },
    col15: { width: '15%' },
    col10: { width: '10%' },
    col50: { width: '50%' },
    col100: { width: '100%' },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    infoLabel: {
        width: '30%',
        fontWeight: 'bold',
    },
    infoValue: {
        width: '70%',
    },
    totalsSection: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        width: '40%',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    grandTotal: {
        backgroundColor: '#4472C4',
        color: 'white',
        padding: 5,
        fontWeight: 'bold',
        fontSize: 12,
    },
    clientSalePrice: {
        backgroundColor: '#70AD47',
        color: 'white',
        padding: 5,
        fontWeight: 'bold',
        fontSize: 12,
    },
    profit: {
        backgroundColor: '#70AD47',
        color: 'white',
        padding: 5,
        fontWeight: 'bold',
        fontSize: 12,
    },
    commentsSection: {
        marginTop: 15,
    },
    commentsBox: {
        border: '1 solid #ccc',
        padding: 10,
        minHeight: 60,
    },
    signatureSection: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureLine: {
        width: '45%',
    },
    signatureText: {
        borderTop: '1 solid #000',
        paddingTop: 5,
        marginTop: 30,
    },
    disclaimer: {
        marginTop: 20,
        fontSize: 8,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    numberingScheme: {
        fontSize: 8,
        textAlign: 'right',
        marginTop: 5,
    },
});

// Work Order PDF Document Component
const WorkOrderDocument = ({ workOrder }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US');
    };

    const formatCurrency = (amount) => {
        return `$${parseFloat(amount).toFixed(2)}`;
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        {/* Logo placeholder - you can add actual logo image here */}
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4472C4' }}>
                            AXONIC
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#C00000' }}>
                            MOTORWORKS
                        </Text>
                    </View>

                    <View style={styles.headerInfo}>
                        <Text style={styles.companyName}>AXONIC MOTORWORKS</Text>
                        <Text style={styles.companyDetails}>
                            16500 Marana St, Bldg 1 Unit{'\n'}
                            Austin, TX, 78728{'\n'}
                            Phone: (512) 754-1450{'\n'}
                            sales@axonicmoto.com{'\n'}
                            www.axonicmoto.com
                        </Text>
                    </View>

                    <View style={styles.workOrderSection}>
                        <Text style={styles.workOrderTitle}>WORK ORDER</Text>
                        <View style={styles.workOrderBox}>
                            <Text style={{ fontSize: 8 }}>WORK ORDER #</Text>
                            <Text style={styles.workOrderNumber}>{workOrder.work_order_number}</Text>
                        </View>
                        <View style={styles.dateBox}>
                            <Text style={{ fontSize: 8 }}>DATE</Text>
                            <Text style={{ fontSize: 10 }}>{formatDate(workOrder.date)}</Text>
                        </View>
                        <Text style={styles.numberingScheme}>
                            Numbering Scheme{'\n'}YR-XXXX
                        </Text>
                    </View>
                </View>

                {/* Client Vehicle Information */}
                <Text style={styles.sectionTitle}>CLIENT VEHICLE INFORMATION</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCol, styles.col20]}>VIN</Text>
                        <Text style={[styles.tableCol, styles.col20]}>Odometer Reading</Text>
                        <Text style={[styles.tableCol, styles.col15]}>Year</Text>
                        <Text style={[styles.tableCol, styles.col20]}>Make</Text>
                        <Text style={[styles.tableCol, styles.col25]}>Model</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCol, styles.col20]}>{workOrder.vehicle_vin || ''}</Text>
                        <Text style={[styles.tableCol, styles.col20]}>{workOrder.vehicle_odometer || ''}</Text>
                        <Text style={[styles.tableCol, styles.col15]}>{workOrder.vehicle_year || ''}</Text>
                        <Text style={[styles.tableCol, styles.col20]}>{workOrder.vehicle_make || ''}</Text>
                        <Text style={[styles.tableCol, styles.col25]}>{workOrder.vehicle_model || ''}</Text>
                    </View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCol, styles.col100]}>License Plate (Last 4)</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCol, styles.col100]}>{workOrder.vehicle_license_plate || ''}</Text>
                    </View>
                </View>

                {/* Client Information */}
                <Text style={styles.sectionTitle}>CLIENT INFORMATION</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCol, styles.col100]}>Name</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCol, styles.col100]}>{workOrder.client_name}</Text>
                    </View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCol, styles.col50]}>Address</Text>
                        <Text style={[styles.tableCol, styles.col20]}>City, St, ZIP</Text>
                        <Text style={[styles.tableCol, styles.col30]}>(000) 000-0000</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCol, styles.col50]}>{workOrder.client_address || ''}</Text>
                        <Text style={[styles.tableCol, styles.col20]}>
                            {[workOrder.client_city, workOrder.client_state, workOrder.client_zip]
                                .filter(Boolean)
                                .join(', ')}
                        </Text>
                        <Text style={[styles.tableCol, styles.col30]}>{workOrder.client_phone || ''}</Text>
                    </View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCol, styles.col100]}>DL/License # and State</Text>
                    </View>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCol, styles.col100]}>{workOrder.client_dl_license || ''}</Text>
                    </View>
                </View>

                {/* Job Details */}
                <Text style={styles.sectionTitle}>JOB DETAILS</Text>
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCol, styles.col10]}>QTY</Text>
                        <Text style={[styles.tableCol, styles.col50]}>DESCRIPTION</Text>
                        <Text style={[styles.tableCol, styles.col10]}>TAXED</Text>
                        <Text style={[styles.tableCol, styles.col15]}>UNIT PRICE</Text>
                        <Text style={[styles.tableCol, styles.col15]}>TOTAL</Text>
                    </View>
                    {workOrder.items && workOrder.items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.tableCol, styles.col10]}>{item.quantity}</Text>
                            <Text style={[styles.tableCol, styles.col50]}>{item.description}</Text>
                            <Text style={[styles.tableCol, styles.col10]}>{item.taxed ? 'Yes' : 'No'}</Text>
                            <Text style={[styles.tableCol, styles.col15]}>{formatCurrency(item.unit_price)}</Text>
                            <Text style={[styles.tableCol, styles.col15]}>{formatCurrency(item.total)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>SUBTOTAL</Text>
                        <Text>{formatCurrency(workOrder.subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TAX RATE</Text>
                        <Text>{(parseFloat(workOrder.tax_rate) * 100).toFixed(3)}%</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TAX</Text>
                        <Text>{formatCurrency(workOrder.tax_amount)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotal]}>
                        <Text>TOTAL</Text>
                        <Text>{formatCurrency(workOrder.total)}</Text>
                    </View>
                    {workOrder.client_sale_price && (
                        <View style={[styles.totalRow, styles.clientSalePrice]}>
                            <Text>Client/Sale Price</Text>
                            <Text>{formatCurrency(workOrder.client_sale_price)}</Text>
                        </View>
                    )}
                    {workOrder.profit && (
                        <View style={[styles.totalRow, styles.profit]}>
                            <Text>PROFIT</Text>
                            <Text>{formatCurrency(workOrder.profit)}</Text>
                        </View>
                    )}
                </View>

                {/* Other Comments */}
                <View style={styles.commentsSection}>
                    <Text style={styles.sectionTitle}>OTHER COMMENTS</Text>
                    <View style={styles.commentsBox}>
                        <Text>{workOrder.other_comments || ''}</Text>
                    </View>
                </View>

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureLine}>
                        <View style={styles.signatureText}>
                            <Text>Signature</Text>
                        </View>
                    </View>
                    <View style={styles.signatureLine}>
                        <View style={styles.signatureText}>
                            <Text>Date</Text>
                        </View>
                    </View>
                </View>

                {/* Disclaimer */}
                <Text style={styles.disclaimer}>
                    I affirm that this Work Order has been fulfilled. Internal Use Only
                </Text>
            </Page>
        </Document>
    );
};

/**
 * Generate PDF buffer from work order data
 */
const generateWorkOrderPDF = async (workOrderData) => {
    try {
        const pdfStream = await ReactPDF.renderToStream(
            React.createElement(WorkOrderDocument, { workOrder: workOrderData })
        );

        return new Promise((resolve, reject) => {
            const chunks = [];
            pdfStream.on('data', (chunk) => chunks.push(chunk));
            pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
            pdfStream.on('error', reject);
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

module.exports = {
    generateWorkOrderPDF,
    WorkOrderDocument
};
