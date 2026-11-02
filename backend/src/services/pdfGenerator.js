const PDFDocument = require('pdfkit');

class PdfGeneratorService {
  /**
   * Generates a styled, multi-page PDF stream for an Offer Letter or Employment Agreement
   * @param {Object} docData - The GeneratedDocument model data
   * @returns {PDFKit.PDFDocument}
   */
  static generateDocumentPdf(docData) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 54, bottom: 54, left: 54, right: 54 },
      bufferPages: true,
      info: {
        Title: docData.title,
        Author: 'Multi-Jurisdiction Employment Localizer SaaS',
        Subject: `Jurisdiction: ${docData.jurisdictionSnapshot?.name}`,
      },
    });

    const primaryColor = '#1e3a8a'; // Deep Navy
    const secondaryColor = '#334155'; // Slate
    const accentColor = '#2563eb'; // Blue
    const mutedColor = '#64748b'; // Muted grey

    // 1. Header & Title Banner
    doc
      .fillColor(primaryColor)
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(docData.title, { align: 'center' });

    doc.moveDown(0.4);

    doc
      .fillColor(mutedColor)
      .fontSize(10)
      .font('Helvetica')
      .text(`Jurisdiction: ${docData.jurisdictionSnapshot?.name} (${docData.jurisdictionSnapshot?.code}) | Version: ${docData.jurisdictionSnapshot?.versionUsed}`, {
        align: 'center',
      });

    doc.moveDown(0.8);
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(54, doc.y).lineTo(541, doc.y).stroke();
    doc.moveDown(1);

    // 2. Candidate & Position Summary Box
    const startY = doc.y;
    doc.rect(54, startY, 487, 86).fillAndStroke('#f8fafc', '#e2e8f0');

    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold');
    doc.text('KEY APPOINTMENT TERMS', 68, startY + 10);

    doc.fillColor(secondaryColor).fontSize(9).font('Helvetica');
    const col1X = 68;
    const col2X = 300;
    let curY = startY + 28;

    doc.text(`Candidate: ${docData.candidate?.fullName}`, col1X, curY);
    doc.text(`Role: ${docData.roleDetails?.jobTitle}`, col2X, curY);
    curY += 16;

    doc.text(`Start Date: ${new Date(docData.roleDetails?.startDate).toLocaleDateString('en-US', { dateStyle: 'long' })}`, col1X, curY);
    doc.text(`Department: ${docData.roleDetails?.department}`, col2X, curY);
    curY += 16;

    doc.text(`Compensation: ${docData.compensation?.currency} ${Number(docData.compensation?.baseSalary).toLocaleString()} (${docData.compensation?.payFrequency})`, col1X, curY);
    doc.text(`Work Mode: ${docData.roleDetails?.workArrangement} (${docData.roleDetails?.workLocation})`, col2X, curY);

    doc.y = startY + 98;
    doc.moveDown(0.8);

    // 3. Render Clauses
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Terms & Statutory Provisions');
    doc.moveDown(0.5);

    let clauseIndex = 1;
    for (const clause of docData.appliedClauses || []) {
      // Check if page needs break
      if (doc.y > 680) {
        doc.addPage();
      }

      doc.fillColor(accentColor).fontSize(11).font('Helvetica-Bold');
      doc.text(`${clauseIndex}. ${clause.title}`, { underline: false });

      if (clause.legalReference) {
        doc.fillColor(mutedColor).fontSize(8).font('Helvetica-Oblique').text(`Legal Basis: ${clause.legalReference}`);
      }

      doc.moveDown(0.3);
      doc.fillColor(secondaryColor).fontSize(9.5).font('Helvetica');
      doc.text(clause.renderedText, {
        align: 'justify',
        lineGap: 2.5,
      });

      doc.moveDown(0.8);
      clauseIndex++;
    }

    // 4. Standalone Custom Clauses (if any)
    if (docData.customClausesAdded && docData.customClausesAdded.length > 0) {
      if (doc.y > 660) doc.addPage();
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Supplementary Company Schedules');
      doc.moveDown(0.5);

      for (const custom of docData.customClausesAdded) {
        if (doc.y > 700) doc.addPage();
        doc.fillColor('#0f766e').fontSize(10.5).font('Helvetica-Bold').text(`${clauseIndex}. ${custom.title}`);
        doc.moveDown(0.3);
        doc.fillColor(secondaryColor).fontSize(9.5).font('Helvetica').text(custom.content, { align: 'justify', lineGap: 2 });
        doc.moveDown(0.8);
        clauseIndex++;
      }
    }

    // 5. Signatures Block
    if (doc.y > 620) {
      doc.addPage();
    }
    doc.moveDown(1);
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Acknowledgment and Acceptance');
    doc.moveDown(0.5);
    doc.fillColor(secondaryColor).fontSize(9).font('Helvetica').text(
      'By signing below, the Employer and Employee agree to be legally bound by the terms and conditions outlined in this Agreement and all statutory rules of the governing jurisdiction.'
    );

    doc.moveDown(2);
    const sigY = doc.y;

    // Employer Sign Line
    doc.strokeColor('#94a3b8').lineWidth(1).moveTo(54, sigY + 40).lineTo(250, sigY + 40).stroke();
    doc.fontSize(8.5).fillColor(secondaryColor).text('For Employer: Authorized Representative', 54, sigY + 45);
    doc.text('Date: ________________________', 54, sigY + 60);

    // Employee Sign Line
    doc.strokeColor('#94a3b8').lineWidth(1).moveTo(310, sigY + 40).lineTo(506, sigY + 40).stroke();
    doc.fontSize(8.5).fillColor(secondaryColor).text(`Employee: ${docData.candidate?.fullName}`, 310, sigY + 45);
    doc.text('Date: ________________________', 310, sigY + 60);

    // 6. Mandatory Legal Disclaimer Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7.5)
        .fillColor('#94a3b8')
        .text(
          `${docData.legalDisclaimer} | Page ${i + 1} of ${range.count}`,
          54,
          770,
          { width: 487, align: 'center' }
        );
    }

    return doc;
  }
}

module.exports = PdfGeneratorService;
