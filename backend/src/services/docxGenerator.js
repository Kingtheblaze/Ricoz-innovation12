const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');

class DocxGeneratorService {
  /**
   * Generates a fully formatted DOCX buffer for the employment document
   * @param {Object} docData - The GeneratedDocument model data
   * @returns {Promise<Buffer>}
   */
  static async generateDocumentDocx(docData) {
    const children = [];

    // Document Title
    children.push(
      new Paragraph({
        text: docData.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );

    // Jurisdiction Subtitle
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `Jurisdiction: ${docData.jurisdictionSnapshot?.name} (${docData.jurisdictionSnapshot?.code}) | Version: ${docData.jurisdictionSnapshot?.versionUsed}`,
            italics: true,
            color: '64748B',
            size: 20,
          }),
        ],
      })
    );

    // Appointment Summary Table
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Candidate Name: ', bold: true }),
                  new TextRun(docData.candidate?.fullName || ''),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Email: ', bold: true }),
                  new TextRun(docData.candidate?.email || ''),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Start Date: ', bold: true }),
                  new TextRun(new Date(docData.roleDetails?.startDate).toLocaleDateString('en-US', { dateStyle: 'long' })),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Job Title: ', bold: true }),
                  new TextRun(docData.roleDetails?.jobTitle || ''),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Department: ', bold: true }),
                  new TextRun(docData.roleDetails?.department || ''),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Base Compensation: ', bold: true }),
                  new TextRun(`${docData.compensation?.currency} ${Number(docData.compensation?.baseSalary).toLocaleString()} (${docData.compensation?.payFrequency})`),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    children.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );

    children.push(
      new Paragraph({
        text: 'Terms & Statutory Labor Provisions',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 180 },
      })
    );

    // Applied Clauses
    let index = 1;
    for (const clause of docData.appliedClauses || []) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index}. ${clause.title}`,
              bold: true,
              size: 22,
              color: '1E3A8A',
            }),
          ],
          spacing: { before: 200, after: 60 },
        })
      );

      if (clause.legalReference) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Statutory Authority: ${clause.legalReference}`,
                italics: true,
                size: 18,
                color: '64748B',
              }),
            ],
            spacing: { after: 80 },
          })
        );
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: clause.renderedText,
              size: 20,
            }),
          ],
          spacing: { after: 180 },
        })
      );

      index++;
    }

    // Standalone Custom Clauses
    if (docData.customClausesAdded && docData.customClausesAdded.length > 0) {
      children.push(
        new Paragraph({
          text: 'Supplementary Company Schedules',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
        })
      );

      for (const custom of docData.customClausesAdded) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index}. ${custom.title}`,
                bold: true,
                size: 22,
                color: '0F766E',
              }),
            ],
            spacing: { before: 180, after: 60 },
          })
        );

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: custom.content,
                size: 20,
              }),
            ],
            spacing: { after: 160 },
          })
        );

        index++;
      }
    }

    // Signature Section
    children.push(
      new Paragraph({
        text: 'Signatures and Acknowledgment',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 120 },
      })
    );

    children.push(
      new Paragraph({
        text: 'IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.',
        spacing: { after: 240 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'For the Employer: _______________________      Date: _______________\n\n' }),
          new TextRun({ text: `For Employee (${docData.candidate?.fullName}): _______________________      Date: _______________` }),
        ],
        spacing: { after: 360 },
      })
    );

    // Disclaimer
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: docData.legalDisclaimer,
            italics: true,
            size: 16,
            color: '94A3B8',
          }),
        ],
        spacing: { before: 240 },
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}

module.exports = DocxGeneratorService;
