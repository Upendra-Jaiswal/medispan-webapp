import React, { useState } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Landing = () => {
  // const publicUrl = process.env.REACT_APP_PUBLIC_URL;
  // const apiKey = process.env.REACT_APP_API_KEY;

  // return (
  //   <div>
  //     <h1>Environment Variables in React</h1>
  //     <p>Public URL: {publicUrl}</p>
  //     <p>API Key: {apiKey}</p>
  //   </div>
  // );

  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please upload a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(
        `${backendUrl}/upload`,
        // "http://localhost:3001/upload", //removed env port for convenience
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const reportData = response.data;
      // Filter for items needing manual review
      const manualReviewItems = reportData.results.filter(
        (item) => item.priceDifference !== 0
      );

      setReport({
        ...reportData,
        manualReviewItems,
      });
      setError(null);
    } catch (err) {
      setError("Error uploading file: " + err.message);
    }
  };

  const handleDownloadPdf = () => {
    if (!report) {
      setError("No report data to download.");
      return;
    }

    const doc = new jsPDF();
    const content = document.getElementById("report-content");
    const downloadBtn = document.getElementById("download-pdf-btn");

    // Hide the button
    if (downloadBtn) {
      downloadBtn.style.display = "none";
    }

    html2canvas(content).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 10, 10, 190, 0);
      doc.save("report.pdf");

      // Show the button again
      if (downloadBtn) {
        downloadBtn.style.display = "block";
      }
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Upload and Generate Report
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md p-2 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Upload
          </button>
        </form>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {report && (
          <div id="report-content" className="mt-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Report
            </h2>

            {/* Uploaded Numbers Table */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-700">
                Uploaded Numbers
              </h3>
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Number</th>
                    <th className="border border-gray-300 p-2">Ratio</th>
                    <th className="border border-gray-300 p-2">Column 11</th>
                    <th className="border border-gray-300 p-2">Column 9</th>
                  </tr>
                </thead>
                <tbody>
                  {report.uploadedNumbers.map((item) => (
                    <tr key={item.number} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {item.number}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.ratio}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.col11}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.col9}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Matched Prices Table */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-700">
                Matched Prices
              </h3>
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Number</th>
                    <th className="border border-gray-300 p-2">
                      Uploaded Column 11
                    </th>
                    <th className="border border-gray-300 p-2">
                      Existing Column 11
                    </th>
                    <th className="border border-gray-300 p-2">
                      Price Difference
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((item) => (
                    <tr key={item.number} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {item.number}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.uploaded.col11}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.existing ? item.existing.col11 : "N/A"}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.priceDifference !== null
                          ? item.priceDifference
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Manual Review Items Table */}
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-700">
                Manual Review Items
              </h3>
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">Number</th>
                    <th className="border border-gray-300 p-2">
                      Uploaded Column 11
                    </th>
                    <th className="border border-gray-300 p-2">
                      Uploaded Column 9
                    </th>
                    <th className="border border-gray-300 p-2">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {report.manualReviewItems.map((item) => (
                    <tr key={item.number} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {item.number}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.uploaded.col11}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.uploaded.col9}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {item.priceDifference !== 0 ? "Need Review" : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleDownloadPdf}
              id="download-pdf-btn" // Added ID
              className="mt-6 w-full py-2 px-4 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
