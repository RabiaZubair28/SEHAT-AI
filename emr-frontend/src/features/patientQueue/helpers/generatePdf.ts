/**
 * Client-Side PDF Generator for Emergency Patient Records
 * Uses jsPDF and jspdf-autotable for PDF generation in the browser
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateEmergencyPatientPDF = (patientData: any) => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(6, 69, 38); // #064526 - custom green
    doc.text("EMERGENCY PATIENT RECORD", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Patient Information Section
    doc.setFontSize(14);
    doc.setTextColor(6, 69, 38); // #064526 - custom green
    doc.text("Patient Information", 14, yPosition);
    yPosition += 7;

    const patientInfo = [
      ["Patient ID:", `#${patientData.id || "N/A"}`],
      [
        "Name:",
        `${patientData.first_name || ""} ${patientData.last_name || ""}`.trim() ||
          "N/A",
      ],
      ["Gender:", patientData.gender || "N/A"],
      ["Date of Birth:", patientData.dob || "N/A"],
      ["Blood Group:", patientData.blood_group || "N/A"],
      ["Mobile Number:", patientData.mobile_no || "N/A"],
      ["Identity Provider:", patientData.identity_provider || "N/A"],
      ["Nationality Status:", patientData.nationality_status || "N/A"],
      ["CNIC:", patientData.cnic || "N/A"],
      ["International ID:", patientData.international_id || "N/A"],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: patientInfo,
      theme: "grid",
      headStyles: {
        fillColor: [6, 69, 38], // #064526 - custom green
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold", fillColor: [240, 240, 240] },
        1: { cellWidth: 120 },
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      margin: { left: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Medical Information Section
    doc.setFontSize(14);
    doc.setTextColor(6, 69, 38); // #064526 - custom green
    doc.text("Medical Information", 14, yPosition);
    yPosition += 7;

    const medicalInfo = [
      ["Service Required:", patientData.service_required || "N/A"],
      ["Other Service:", patientData.other_service || "N/A"],
      ["Presenting Complaint:", patientData.presenting_complaint || "N/A"],
      ["Past Medical History:", patientData.past_medical_history || "N/A"],
      [
        "Medicine Administered:",
        patientData.medicine_administered ? "Yes" : "No",
      ],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: medicalInfo,
      theme: "grid",
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold", fillColor: [240, 240, 240] },
        1: { cellWidth: 120 },
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      margin: { left: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Vitals Section
    if (patientData.vitals) {
      const vitals = patientData.vitals;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(6, 69, 38); // #064526 - custom green
      doc.text("Vital Signs", 14, yPosition);
      yPosition += 7;

      const vitalsInfo = [
        ["Temperature:", `${vitals.temperature || "N/A"} °F`],
        ["Pulse:", `${vitals.pulse || "N/A"} bpm`],
        [
          "Blood Pressure:",
          `${vitals.systolic_bp || "N/A"}/${vitals.diastolic_bp || "N/A"} mmHg`,
        ],
        [
          "Respiratory Rate:",
          `${vitals.respiratory_rate || "N/A"} breaths/min`,
        ],
        ["SpO2:", `${vitals.spo2 || "N/A"}%`],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: vitalsInfo,
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold", fillColor: [240, 240, 240] },
          1: { cellWidth: 120 },
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        margin: { left: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Facility Information Section
    if (patientData.facility) {
      const facility = patientData.facility;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(6, 69, 38); // #064526 - custom green
      doc.text("Facility Information", 14, yPosition);
      yPosition += 7;

      const facilityInfo = [
        ["Facility Name:", facility.name || "N/A"],
        ["Facility Code:", facility.code || "N/A"],
        ["Facility Type:", facility.facility_type || "N/A"],
        ["Managed By:", facility.managed_by || "N/A"],
        ["Level of Care:", facility.level_of_care || "N/A"],
        ["24/7 Service:", facility.is_24_7 ? "Yes" : "No"],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: facilityInfo,
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold", fillColor: [240, 240, 240] },
          1: { cellWidth: 120 },
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        margin: { left: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Doctor Information Section
    if (patientData.doctor) {
      const doctor = patientData.doctor;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(6, 69, 38); // #064526 - custom green
      doc.text("Attending Doctor", 14, yPosition);
      yPosition += 7;

      const doctorInfo = [
        [
          "Doctor Name:",
          `${doctor.first_name || ""} ${doctor.last_name || ""}`.trim() ||
            "N/A",
        ],
        ["Email:", doctor.email || "N/A"],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: doctorInfo,
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold", fillColor: [240, 240, 240] },
          1: { cellWidth: 120 },
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        margin: { left: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Prescriptions Section
    if (patientData.prescriptions && patientData.prescriptions.length > 0) {
      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(6, 69, 38); // #064526 - custom green
      doc.text("Prescriptions", 14, yPosition);
      yPosition += 7;

      const prescriptionData = patientData.prescriptions.map(
        (prescription: any) => {
          const medicineVariant = prescription.medicineVariant || {};
          const medicine = medicineVariant.medicine || {};

          return [
            medicine.name || "N/A",
            medicineVariant.strength || "N/A",
            medicineVariant.unit || "N/A",
            prescription.quantity?.toString() || "N/A",
            prescription.medicineDispensed ? "Yes" : "No",
          ];
        }
      );

      autoTable(doc, {
        startY: yPosition,
        head: [["Medicine", "Strength", "Unit", "Quantity", "Dispensed"]],
        body: prescriptionData,
        theme: "grid",
        headStyles: {
          fillColor: [6, 69, 38], // #064526 - custom green
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
        },
        margin: { left: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Outcome Section
    if (patientData.outcome) {
      const outcome = patientData.outcome;

      // Check if we need a new page
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(6, 69, 38); // #064526 - custom green
      doc.text("Outcome", 14, yPosition);
      yPosition += 7;

      const outcomeInfo = [
        ["Outcome:", outcome.outcome || "N/A"],
        ["Level of Care:", outcome.level_of_care || "N/A"],
        ["Type of Service:", outcome.type_of_service || "N/A"],
        ["Reason of Referral:", outcome.reason_of_referral || "N/A"],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: outcomeInfo,
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold", fillColor: [240, 240, 240] },
          1: { cellWidth: 120 },
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        margin: { left: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      const footerText = `Generated on: ${new Date().toLocaleString()}`;
      doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
        align: "center",
      });
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 20,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    }

    // Save the PDF
    const fileName = `emergency_patient_${patientData.id}_${Date.now()}.pdf`;
    doc.save(fileName);
  } catch (error) {
    throw error;
  }
};