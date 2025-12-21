import { Invoice, Product, CompanyInfo } from '../types';

export const exportInvoiceToXML = (invoice: Invoice, companyInfo: CompanyInfo) => {
  // Basic UBL-TR Skeleton
  // Note: This is a simplified valid structure. Real production UBLs might need more specific fields depending on the integrator.
  
  const formattedDate = invoice.date; // YYYY-MM-DD
  const totalAmount = invoice.amount.toFixed(2);
  const currency = "TRY";

  let invoiceLinesXML = '';

  invoice.items.forEach((item, index) => {
    const lineTotal = item.total.toFixed(2);
    const unitPrice = item.unitPrice.toFixed(2);
    
    invoiceLinesXML += `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="NIU">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${currency}">${lineTotal}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${currency}">0.00</cbc:TaxAmount>
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="${currency}">${lineTotal}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="${currency}">0.00</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cac:TaxScheme>
                        <cbc:Name>KDV</cbc:Name>
                        <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${item.productName}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${currency}">${unitPrice}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
  });

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" 
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
    <cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>
    <cbc:ID>${invoice.id}</cbc:ID>
    <cbc:CopyIndicator>false</cbc:CopyIndicator>
    <cbc:UUID>${crypto.randomUUID()}</cbc:UUID>
    <cbc:IssueDate>${formattedDate}</cbc:IssueDate>
    <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
    
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${companyInfo.title}</cbc:Name>
            </cac:PartyName>
            <cac:PartyIdentification>
                <cbc:ID schemeID="VKN">${companyInfo.vkn}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>Vergi Dairesi</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PostalAddress>
                <cbc:CityName>${companyInfo.city}</cbc:CityName>
                <cac:Country>
                    <cbc:Name>Türkiye</cbc:Name>
                </cac:Country>
            </cac:PostalAddress>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyName>
                <cbc:Name>${invoice.customerName}</cbc:Name>
            </cac:PartyName>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:Name>Vergi Dairesi</cbc:Name>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingCustomerParty>
    
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${currency}">0.00</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${currency}">${totalAmount}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${currency}">0.00</cbc:TaxAmount>
            <cac:TaxCategory>
                <cac:TaxScheme>
                    <cbc:Name>KDV</cbc:Name>
                    <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${currency}">${totalAmount}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${currency}">${totalAmount}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${currency}">${totalAmount}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="${currency}">${totalAmount}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
    ${invoiceLinesXML}
</Invoice>`;

  // Trigger Download
  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.id}_EARSIV.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};