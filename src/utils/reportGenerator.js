import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export const generateWordReport = (records, departmentName) => {
    // 1. Process Data
    const summary = {
        '1 Tahun': 0,
        '2 Tahun': 0,
        '3 Tahun': 0,
        '4 Tahun': 0,
    };

    records.forEach(record => {
        // Parse the age. Ensure it handles strings or numbers. 
        // Assuming 'umur_komputer' might be like "1", "2", etc.
        const ageVal = record.umur_komputer;
        if (!ageVal) return;

        const age = parseInt(ageVal, 10);

        if (!isNaN(age)) {
            if (age === 1) summary['1 Tahun']++;
            else if (age === 2) summary['2 Tahun']++;
            else if (age === 3) summary['3 Tahun']++;
            else if (age >= 4) summary['4 Tahun']++;
        }
    });

    // 2. Create Table Rows from Data
    const tableHeader = new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: "Tahun PC", bold: true })]
                })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: "center",
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: "Jumlah", bold: true })]
                })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                verticalAlign: "center",
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
            }),
        ],
    });

    const dataRows = Object.keys(summary).map((key) => {
        return new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph(key)],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                }),
                new TableCell({
                    children: [new Paragraph(summary[key].toString())],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                }),
            ],
        });
    });

    // 3. Construct Document
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: departmentName || "Bahagian IT",
                                bold: false, // Image shows regular text for header, maybe slightly larger
                                size: 28, // 14pt
                            }),
                        ],
                        spacing: { after: 400 },
                    }),
                    new Table({
                        rows: [tableHeader, ...dataRows],
                        width: { size: 100, type: WidthType.PERCENTAGE },
                    }),
                ],
            },
        ],
    });

    // 4. Generate and Save
    Packer.toBlob(doc).then((blob) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Laporan_PC_${departmentName ? departmentName.replace(/\s+/g, '_') : 'Department'}_${timestamp}.docx`;
        saveAs(blob, fileName);
    });
};
