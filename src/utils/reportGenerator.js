import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export const generateWordReport = (records, departmentName) => {

    // Helper: Calculate Age Summary
    const getSummary = (data) => {
        const summary = {
            '1 Tahun': 0,
            '2 Tahun': 0,
            '3 Tahun': 0,
            '4 Tahun': 0,
        };

        const currentYear = new Date().getFullYear();

        data.forEach(record => {
            const ageVal = record.umur_komputer;
            if (!ageVal) return;
            let age = parseInt(ageVal, 10);

            if (!isNaN(age)) {
                // If value is a year (e.g. 2024), convert to age
                if (age > 1900) {
                    age = currentYear - age;
                }

                if (age === 1) summary['1 Tahun']++;
                else if (age === 2) summary['2 Tahun']++;
                else if (age === 3) summary['3 Tahun']++;
                else if (age >= 4) summary['4 Tahun']++; // Buckets 4+ into 4 Tahun
            }
        });
        return summary;
    };

    // Helper: Create Table
    const createSummaryTable = (summary) => {
        const tableHeader = new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Tahun PC", bold: false })] })], // Template shows normal weight or slight bold
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                }),
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Jumlah", bold: false })] })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
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

        return new Table({
            rows: [tableHeader, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
            // Ensure simple borders
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
        });
    };

    const docChildren = [];

    // Only add Main Title if NOT strictly following the 'list' template for admin
    // The user's image starts directly with "Bahagian IT".
    // We will conditionally add a title for single-dept reports, but for "Keseluruhan", we might just skip it or make it small.
    // Let's adhere to "follow this template": The template HAS NO main title.
    if (departmentName !== 'Keseluruhan') {
        docChildren.push(
            new Paragraph({
                children: [new TextRun({ text: departmentName || "Bahagian IT", bold: true, size: 28 })],
                spacing: { after: 400 },
            })
        );
    }

    if (departmentName === 'Keseluruhan') {
        const groups = {};
        records.forEach(r => {
            const d = r.dept || r.cawangan || 'Lain-lain';
            if (!groups[d]) groups[d] = [];
            groups[d].push(r);
        });

        const sortedDepts = Object.keys(groups).sort();

        sortedDepts.forEach(dept => {
            // Dept Header
            docChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: dept, size: 24 })], // Regular size 12pt (24 half-pt), no bold per template if strictly followed? Image looks normal.
                    spacing: { before: 400, after: 100 },
                })
            );

            // Table
            const summary = getSummary(groups[dept]);
            docChildren.push(createSummaryTable(summary));
            // Add spacing between tables
            docChildren.push(new Paragraph(""));
        });

    } else {
        const summary = getSummary(records);
        docChildren.push(createSummaryTable(summary));
    }

    const doc = new Document({
        sections: [{ properties: {}, children: docChildren }],
    });

    Packer.toBlob(doc).then((blob) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Laporan_PC_${departmentName ? departmentName.replace(/\s+/g, '_') : 'Department'}_${timestamp}.docx`;
        saveAs(blob, fileName);
    });
};
