import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, BorderStyle } from "docx";
import { saveAs } from "file-saver";

export const generateWordReport = (records, departmentName) => {

    // Helper: Calculate Age Summary (Dynamic Ages)
    const getSummary = (data) => {
        const summary = {};
        const currentYear = new Date().getFullYear();

        data.forEach(record => {
            const val = parseInt(record.umur_komputer, 10);
            if (isNaN(val)) return;

            let age;
            if (val > 1900) {
                age = currentYear - val;
            } else {
                age = val;
            }

            if (age !== undefined && age >= 0) {
                const key = `${age} Tahun`;
                summary[key] = (summary[key] || 0) + 1;
            }
        });
        return summary;
    };

    // Helper: Create Table
    const createSummaryTable = (summary) => {
        const tableHeader = new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Umur PC", bold: false })] })],
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

        // Sort Ascending by Age (1, 2, 10...)
        const sortedKeys = Object.keys(summary).sort((a, b) => parseInt(a) - parseInt(b));

        const dataRows = sortedKeys.map((key) => {
            if (!summary[key] || summary[key] <= 0) return null;

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
        }).filter(row => row !== null);

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

    // Only add Main Title if NOT directly listing departments (or for single dept report)
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
                    children: [new TextRun({ text: dept, size: 24 })],
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
