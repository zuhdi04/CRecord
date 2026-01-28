import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, HeadingLevel } from "docx";
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

        data.forEach(record => {
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
        return summary;
    };

    // Helper: Create Table
    const createSummaryTable = (summary) => {
        const tableHeader = new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Tahun PC", bold: true })] })],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    verticalAlign: "center",
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                }),
                new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Jumlah", bold: true })] })],
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

        return new Table({
            rows: [tableHeader, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });
    };

    const docChildren = [];
    const mainTitle = departmentName === 'Keseluruhan' ? "Laporan Keseluruhan Mengikut Bahagian" : (departmentName || "Bahagian IT");

    // Title Paragraph
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: mainTitle,
                    bold: true,
                    size: 28,
                }),
            ],
            spacing: { after: 400 },
        })
    );

    if (departmentName === 'Keseluruhan') {
        // Group by Department
        const groups = {};
        records.forEach(r => {
            // Normalize dept name
            const d = r.dept || r.cawangan || 'Lain-lain';
            if (!groups[d]) groups[d] = [];
            groups[d].push(r);
        });

        // Sort departments alphabetically
        const sortedDepts = Object.keys(groups).sort();

        sortedDepts.forEach(dept => {
            // Department Header
            docChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: dept, bold: true, size: 24 })],
                    spacing: { before: 400, after: 200 },
                    heading: HeadingLevel.HEADING_2
                })
            );

            // Summary Table for Dept
            const summary = getSummary(groups[dept]);
            const table = createSummaryTable(summary);
            docChildren.push(table);
        });

    } else {
        // Single Department Report
        const summary = getSummary(records);
        const table = createSummaryTable(summary);
        docChildren.push(table);
    }

    // Generator
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: docChildren,
            },
        ],
    });

    Packer.toBlob(doc).then((blob) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `Laporan_PC_${departmentName ? departmentName.replace(/\s+/g, '_') : 'Department'}_${timestamp}.docx`;
        saveAs(blob, fileName);
    });
};
