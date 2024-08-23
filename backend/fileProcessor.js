import XLSX from "xlsx";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the existing file in the same directory as fileProcessor.js
const existingFilePath = join(__dirname, "Georgia Billing File Example.xlsx");

export function processFile(uploadedFilePath) {
  // Read the uploaded file
  const uploadedWorkbook = XLSX.readFile(uploadedFilePath);
  const uploadedSheetName = uploadedWorkbook.SheetNames[0];
  const uploadedSheet = uploadedWorkbook.Sheets[uploadedSheetName];

  // Get all numbers from column index 6 (7th column) of all rows in the uploaded file
  const rangeUploaded = XLSX.utils.decode_range(uploadedSheet["!ref"]); // Get the range of the sheet
  const uploadedNumbers = [];

  for (let row = rangeUploaded.s.r; row <= rangeUploaded.e.r; row++) {
    const cellAddress = { c: 6, r: row }; // Column index is 6 (7th column)
    const cell = uploadedSheet[XLSX.utils.encode_cell(cellAddress)];

    if (cell) {
      uploadedNumbers.push({ row, value: cell.v }); // Store row and value
    }
  }

  if (uploadedNumbers.length === 0) {
    throw new Error("No numbers found in the uploaded file.");
  }

  // Read the existing file
  const existingWorkbook = XLSX.readFile(existingFilePath);
  const existingSheetName = existingWorkbook.SheetNames[0];
  const existingSheet = existingWorkbook.Sheets[existingSheetName];

  // Search for each number in column index 6 (7th column) of the existing file
  const rangeExisting = XLSX.utils.decode_range(existingSheet["!ref"]); // Get the range of the sheet
  const results = [];
  const existingData = {};

  for (let row = rangeExisting.s.r; row <= rangeExisting.e.r; row++) {
    const cellAddress = { c: 6, r: row }; // Column index is 6 (7th column)
    const cell = existingSheet[XLSX.utils.encode_cell(cellAddress)];

    if (cell && uploadedNumbers.some((u) => u.value === cell.v)) {
      // Store data for the matching row
      const col11 = existingSheet[XLSX.utils.encode_cell({ c: 11, r: row })];
      const col9 = existingSheet[XLSX.utils.encode_cell({ c: 9, r: row })];

      const col11Value = col11 ? col11.v : null;
      const col9Value = col9 ? col9.v : null;

      if (col11Value !== null && col9Value !== null && col9Value !== 0) {
        const ratio = col11Value / col9Value;
        results.push({ row, value: cell.v, ratio });
        existingData[cell.v] = { col11: col11Value, col9: col9Value, ratio };
      }
    }
  }

  // Compute ratios for the uploaded file
  const uploadedRatios = uploadedNumbers
    .map((u) => {
      const col11 = uploadedSheet[XLSX.utils.encode_cell({ c: 11, r: u.row })];
      const col9 = uploadedSheet[XLSX.utils.encode_cell({ c: 9, r: u.row })];

      const col11Value = col11 ? col11.v : null;
      const col9Value = col9 ? col9.v : null;

      if (col11Value !== null && col9Value !== null && col9Value !== 0) {
        const ratio = col11Value / col9Value;
        return { number: u.value, ratio, col11: col11Value, col9: col9Value };
      }
      return null;
    })
    .filter((r) => r !== null);

  // Find and return the prices where ratios match
  const matchedPrices = uploadedRatios.map((u) => {
    const existing = existingData[u.number];
    if (existing) {
      const priceDifference = existing.col11 - u.col11;
      return {
        number: u.number,
        uploaded: { col11: u.col11, col9: u.col9, ratio: u.ratio },
        existing: {
          col11: existing.col11,
          col9: existing.col9,
          ratio: existing.ratio,
        },
        priceDifference,
      };
    }
    return {
      number: u.number,
      uploaded: { col11: u.col11, col9: u.col9, ratio: u.ratio },
      existing: null,
      priceDifference: null,
    };
  });

  // Flag items that cannot be priced or have discrepancies
  const manualReviewItems = uploadedRatios
    .filter((u) => !existingData[u.number])
    .map((u) => ({
      number: u.number,
      uploaded: { col11: u.col11, col9: u.col9, ratio: u.ratio },
      existing: null,
      priceDifference: null,
      flag: "Manual review needed",
    }));

  return {
    uploadedNumbers: uploadedRatios,
    results: matchedPrices,
    manualReviewItems,
  };
}
