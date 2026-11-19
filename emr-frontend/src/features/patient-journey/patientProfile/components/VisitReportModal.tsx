import React, { useEffect, useState } from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Tabs,
  Button,
  Spin,
  Row,
  Col,
  Card,
  Table,
} from "antd";
import { CloseOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useLazyGetVisitDetailsQuery } from "@/features/patient-journey/services/patientProfileApi";

type VisitReportModalProps = {
  open: boolean;
  visitId: number | null;
  visitNumber?: number | null;
  onClose: () => void;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const getDefaultTabKey = (visitDetails: any) => {
  if (!visitDetails?.appointments) return "0";

  for (let appIndex = 0; appIndex < visitDetails.appointments.length; appIndex++) {
    const services = visitDetails.appointments[appIndex]?.services || {};
    const serviceNames = Object.keys(services);

    if (serviceNames.length > 0) {
      return `${appIndex}-0`;
    }
  }

  return "0";
};

const generateServiceHTML = (service: any, serviceName: string) => {
  let html = `<div class="section-title">${serviceName.replace(/_/g, " ")} SERVICE</div>`;

  const addSectionToPDF = (sectionData: any, title: string, isArray = false) => {
    if (!sectionData) return "";

    let sectionHTML = `<div class="subsection-title">${title}</div><table>`;

    const formatLabel = (key: string) => {
      return key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim()
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    if (isArray && Array.isArray(sectionData)) {
      sectionData.forEach((item: any, index: number) => {
        sectionHTML += `<tr><td colspan="2" class="subsection-title">${title} ${
          index + 1
        }</td></tr>`;
        Object.entries(item).forEach(([key, value]) => {
          if (["id", "createdAt", "updatedAt"].includes(key)) return;
          sectionHTML += `<tr><td class="label">${formatLabel(
            key,
          )}</td><td class="value">${formatValue(value)}</td></tr>`;
        });
      });
    } else {
      Object.entries(sectionData).forEach(([key, value]) => {
        if (["id", "createdAt", "updatedAt"].includes(key)) return;

        const formattedLabel = formatLabel(key);

        if (
          key === "lmp" ||
          key === "expected_date_of_delivery" ||
          key === "resultLabDate"
        ) {
          sectionHTML += `<tr><td class="label">${formattedLabel}</td><td class="value">${
            value ? dayjs(value as string).format("DD/MM/YYYY") : "N/A"
          }</td></tr>`;
        } else if (key === "previous_pregnancies" && Array.isArray(value)) {
          sectionHTML += `<tr><td colspan="2" class="subsection-title">Previous Pregnancies</td></tr>`;
          (value as any[]).forEach((pregnancy: any, idx: number) => {
            sectionHTML += `<tr><td colspan="2" style="padding: 10px; background: #fafafa;">`;
            sectionHTML += `<strong>Pregnancy ${idx + 1}</strong><br>`;
            sectionHTML += `<strong>Place:</strong> ${
              pregnancy.place_of_delivery || "N/A"
            }<br>`;
            sectionHTML += `<strong>Mode:</strong> ${
              pregnancy.mode_of_delivery || "N/A"
            }<br>`;
            sectionHTML += `<strong>Outcome:</strong> ${pregnancy.outcome || "N/A"}<br>`;
            sectionHTML += `<strong>Complications:</strong> ${
              pregnancy.complication && Array.isArray(pregnancy.complication)
                ? pregnancy.complication.join(", ")
                : "None"
            }`;
            sectionHTML += `</td></tr>`;
          });
        } else if (key === "labTestsPrescribed" && Array.isArray(value)) {
          sectionHTML += `<tr><td class="label">Lab Tests Prescribed</td><td class="value">${(
            value as any[]
          )
            .map((test) => `${test.name} (${test.urgency})`)
            .join("<br>")}</td></tr>`;
        } else {
          sectionHTML += `<tr><td class="label">${formattedLabel}</td><td class="value">${formatValue(
            value,
          )}</td></tr>`;
        }
      });
    }

    sectionHTML += "</table>";
    return sectionHTML;
  };

  if (service.familyPlanning)
    html += addSectionToPDF(service.familyPlanning, "Family Planning");
  if (service.pregnancyInfo)
    html += addSectionToPDF(service.pregnancyInfo, "Pregnancy Information");
  if (service.ancMedicalSurgicalHistory)
    html += addSectionToPDF(
      service.ancMedicalSurgicalHistory,
      "Medical & Surgical History",
    );
  if (service.opdMedicalHistory)
    html += addSectionToPDF(service.opdMedicalHistory, "OPD Medical History");
  if (service.ancVitalAssessment)
    html += addSectionToPDF(service.ancVitalAssessment, "ANC Vital Assessment");
  if (service.pncVitalAssessment)
    html += addSectionToPDF(service.pncVitalAssessment, "PNC Vital Assessment");
  if (service.nutritionVitalAssessment)
    html += addSectionToPDF(
      service.nutritionVitalAssessment,
      "Nutrition Vital Assessment",
    );
  if (service.opdVitals) html += addSectionToPDF(service.opdVitals, "OPD Vitals");
  if (service.diagnosis)
    html += addSectionToPDF(service.diagnosis, "Diagnosis & Screening");
  if (service.opdDiagnosis)
    html += addSectionToPDF(service.opdDiagnosis, "OPD Diagnosis");
  if (service.ultrasound)
    html += addSectionToPDF(service.ultrasound, "Ultrasound");
  if (service.ctg)
    html += addSectionToPDF(service.ctg, "Cardiotocography (CTG)");
  if (service.pncBreastfeeding)
    html += addSectionToPDF(service.pncBreastfeeding, "PNC Breastfeeding");
  if (service.pncFamilyPlanning)
    html += addSectionToPDF(service.pncFamilyPlanning, "PNC Family Planning");
  if (service.pncNutrition)
    html += addSectionToPDF(service.pncNutrition, "PNC Nutrition");
  if (service.nutritionServiceInfo)
    html += addSectionToPDF(
      service.nutritionServiceInfo,
      "Nutrition Service Information",
    );
  if (service.preDeliveryAssesment) {
    html += addSectionToPDF(service.preDeliveryAssesment, "Pre-Delivery Assessment");
  }

  if (service.dispenser) {
    html += `<div class="subsection-title">Medicine Dispensing</div><table>`;
    html += `<tr><td class="label">Dispensed By</td><td class="value">${
      service.dispenser.dispensedBy
        ? `${service.dispenser.dispensedBy.first_name} ${service.dispenser.dispensedBy.last_name}`
        : "N/A"
    }</td></tr>`;
    html += `<tr><td class="label">OTC Required</td><td class="value">${
      service.dispenser.otcMedRequired ? "Yes" : "No"
    }</td></tr>`;
    html += `<tr><td class="label">Remarks</td><td class="value">${
      service.dispenser.remarks || "N/A"
    }</td></tr>`;
    html += `</table>`;

    if (service.dispenser.items && service.dispenser.items.length > 0) {
      html += `<div class="subsection-title">Dispensed Medicines</div><table>`;
      html += `<tr><th>Medicine Name</th><th>Generic Name</th><th>Form</th><th>Strength</th><th>Batch Number</th><th>Qty</th><th>Expiry Date</th><th>OTC</th></tr>`;

      service.dispenser.items.forEach((item: any) => {
        const variant = item.medicineVariant;
        const medicine = variant?.medicine;
        const batch = item.batch;

        html += `<tr>`;
        html += `<td><strong>${medicine?.name || "N/A"}</strong></td>`;
        html += `<td>${medicine?.generic_name || "N/A"}</td>`;
        html += `<td>${variant?.unit || "N/A"}</td>`;
        html += `<td>${variant?.strength || "N/A"}</td>`;
        html += `<td>${batch?.batch_number || "N/A"}</td>`;
        html += `<td>${item.dispensed_qty || "N/A"}</td>`;
        html += `<td>${
          batch?.expiry_date ? dayjs(batch.expiry_date).format("DD/MM/YYYY") : "N/A"
        }</td>`;
        html += `<td>${item.otc ? "Yes" : "No"}</td>`;
        html += `</tr>`;
      });
      html += "</table>";
    }
  }

  if (service.postDeliveryAssesment) {
    html += `<div class="subsection-title">Post-Delivery Assessment</div><table>`;
    Object.entries(service.postDeliveryAssesment).forEach(([key, value]) => {
      if (["id", "createdAt", "updatedAt", "medicinesAdministered"].includes(key)) {
        return;
      }
      const formattedLabel = key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim()
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      html += `<tr><td class="label">${formattedLabel}</td><td class="value">${formatValue(
        value,
      )}</td></tr>`;
    });

    if (
      service.postDeliveryAssesment.medicinesAdministered &&
      service.postDeliveryAssesment.medicinesAdministered.length > 0
    ) {
      html += `<tr><td colspan="2" class="subsection-title">Medicines Administered</td></tr>`;
      html += `<tr><th>Medicine Name</th><th>Generic Name</th><th>Form</th><th>Strength</th><th>Quantity</th></tr>`;

      service.postDeliveryAssesment.medicinesAdministered.forEach((med: any) => {
        const variant = med.medicineVariant;
        const medicine = variant?.medicine;

        html += `<tr>`;
        html += `<td><strong>${medicine?.name || "N/A"}</strong></td>`;
        html += `<td>${medicine?.generic_name || "N/A"}</td>`;
        html += `<td>${variant?.unit || "N/A"}</td>`;
        html += `<td>${variant?.strength || "N/A"}</td>`;
        html += `<td>${med.quantity || "N/A"}</td>`;
        html += `</tr>`;
      });
    }
  }

  if (service.newbornAssesment && service.newbornAssesment.length > 0) {
    html += `<div class="subsection-title">Newborn Assessment</div><table>`;
    service.newbornAssesment.forEach((newborn: any, index: number) => {
      html += `<tr><td colspan="2" class="subsection-title">Newborn ${index + 1}</td></tr>`;
      Object.entries(newborn).forEach(([key, value]) => {
        if (["id", "createdAt", "updatedAt", "medicinesAdministered"].includes(key)) {
          return;
        }
        const formattedLabel = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .trim()
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        html += `<tr><td class="label">${formattedLabel}</td><td class="value">${formatValue(
          value,
        )}</td></tr>`;
      });

      if (newborn.medicinesAdministered && newborn.medicinesAdministered.length > 0) {
        html += `<tr><td colspan="2" class="subsection-title">Medicines Administered to Newborn ${
          index + 1
        }</td></tr>`;
        newborn.medicinesAdministered.forEach((med: any, idx: number) => {
          html += `<tr><td class="label">Medicine ${
            idx + 1
          }</td><td class="value">Variant ID: ${med.medicine_variant_id}, Quantity: ${
            med.quantity
          }</td></tr>`;
        });
      }
    });
    html += "</table>";
  }

  if (service.deliveryDischargeDetails) {
    html += addSectionToPDF(service.deliveryDischargeDetails, "Delivery Discharge Details");
  }

  if (service.deliveryReferralDetails && service.deliveryReferralDetails.length > 0) {
    html += addSectionToPDF(
      service.deliveryReferralDetails,
      "Delivery Referral Details",
      true,
    );
  }

  if (service.immunisations && service.immunisations.length > 0) {
    html += `<div class="subsection-title">Immunisations</div><table>`;
    service.immunisations.forEach((immunisation: any) => {
      if (immunisation.immunisationCard) {
        const card = immunisation.immunisationCard;
        html += `<tr><td class="label">Place of Delivery</td><td class="value">${
          card.placeOfDelivery || "N/A"
        }</td></tr>`;
        html += `<tr><td class="label">Other Place</td><td class="value">${
          card.otherPlace || "N/A"
        }</td></tr>`;
        html += `<tr><td class="label">Level of Care</td><td class="value">${
          card.level_of_care || "N/A"
        }</td></tr>`;
        html += `<tr><td class="label">Other Facility Name</td><td class="value">${
          card.otherFacilityName || "N/A"
        }</td></tr>`;
        html += `<tr><td class="label">Card Available</td><td class="value">${
          card.immunisationCardAvailable ? "Yes" : "No"
        }</td></tr>`;
        html += `<tr><td class="label">EPI Card Provided</td><td class="value">${
          card.epiCardProvided ? "Yes" : "No"
        }</td></tr>`;
        html += `<tr><td class="label">EPI Number</td><td class="value">${
          card.epiNumber || "N/A"
        }</td></tr>`;
      }

      if (immunisation.doses && immunisation.doses.length > 0) {
        html += `<tr><td colspan="2" class="subsection-title">Vaccines Administered</td></tr>`;
        immunisation.doses.forEach((dose: any, doseIdx: number) => {
          const vaccine = dose.vaccine;
          html += `<tr><td colspan="2" style="padding: 10px; background: #fafafa;">`;
          html += `<strong>Dose ${doseIdx + 1}</strong><br>`;
          html += `<strong>Vaccine:</strong> ${
            vaccine?.display_name || vaccine?.code || "N/A"
          }<br>`;
          html += `<strong>Code:</strong> ${vaccine?.code || "N/A"}<br>`;
          html += `<strong>Date Administered:</strong> ${
            dose.dateAdministered ? dayjs(dose.dateAdministered).format("DD/MM/YYYY") : "N/A"
          }<br>`;
          html += `<strong>Status:</strong> ${dose.status || "N/A"}<br>`;
          if (vaccine?.applies_to) {
            html += `<strong>Applies To:</strong> ${vaccine.applies_to}<br>`;
          }
          if (vaccine?.dose_number !== undefined) {
            html += `<strong>Dose Number:</strong> ${vaccine.dose_number}`;
          }
          html += `</td></tr>`;
        });
      } else {
        html += `<tr><td class="label">Vaccines</td><td class="value">No vaccines administered</td></tr>`;
      }
    });
    html += "</table>";
  }

  if (service.prescriptions && service.prescriptions.length > 0) {
    html += `<div class="subsection-title">Prescriptions</div><table>`;
    html += `<tr><th>Medicine Name</th><th>Generic Name</th><th>Form</th><th>Strength</th><th>Dosage</th><th>Duration</th><th>Quantity</th><th>Instructions</th><th>Dispensed</th></tr>`;

    service.prescriptions.forEach((prescription: any) => {
      const variant = prescription.medicineVariant;
      const medicine = variant?.medicine;
      html += `<tr>`;
      html += `<td><strong>${medicine?.name || "N/A"}</strong></td>`;
      html += `<td>${medicine?.generic_name || "N/A"}</td>`;
      html += `<td>${variant?.unit || "N/A"}</td>`;
      html += `<td>${variant?.strength || "N/A"}</td>`;
      html += `<td>${prescription.medicineDosage || "N/A"}</td>`;
      html += `<td>${
        prescription.medicineDuration ? `${prescription.medicineDuration} days` : "N/A"
      }</td>`;
      html += `<td>${prescription.quantity || "N/A"}</td>`;
      html += `<td>${prescription.medicineInstruction || "N/A"}</td>`;
      html += `<td>${prescription.medicineDispensed ? "Yes" : "No"}</td>`;
      html += `</tr>`;
    });
    html += "</table>";
  }

  return html;
};

const generatePDFContent = (visit: any, patientInfo: any, visitNumber: number) => {
  const appointments = visit.appointments || [];
  let servicesHTML = "";

  appointments.forEach((appointment: any) => {
    const services = appointment.services || {};
    Object.keys(services).forEach((serviceName) => {
      const serviceData = services[serviceName];
      if (serviceData && serviceData.length > 0) {
        serviceData.forEach((service: any) => {
          servicesHTML += generateServiceHTML(service, serviceName);
        });
      }
    });
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Visit Report - ${patientInfo?.fullName || "Patient"}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; line-height: 1.6; }
        h2 { color: #333; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 20px; }
        .header-section { margin-bottom: 20px; border: 1px solid #000; padding: 15px; }
        .patient-info { margin-bottom: 8px; }
        .info-label { font-weight: bold; min-width: 200px; display: inline-block; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #000; table-layout: fixed; }
        th, td { border: 1px solid #000; padding: 8px 10px; text-align: left; vertical-align: top; word-wrap: break-word; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .section-title { background-color: #e0e0e0; padding: 10px; font-weight: bold; margin-top: 20px; border: 1px solid #000; text-transform: uppercase; }
        .subsection-title { background-color: #f5f5f5; padding: 8px; font-weight: bold; margin-top: 15px; border-left: 3px solid #000; }
        .signature-section { margin-top: 40px; text-align: right; }
        .visit-info { text-align: center; margin-bottom: 20px; font-weight: bold; }
        .label { font-weight: bold; color: #333; width: 40%; word-wrap: break-word; overflow-wrap: break-word; }
        .value { width: 60%; word-wrap: break-word; overflow-wrap: break-word; }
      </style>
    </head>
    <body>
      <div class="visit-info">
        <h2>VISIT REPORT - PATIENT COPY</h2>
        <div>Visit: #${visitNumber} | Date: ${dayjs(visit.visitDate).format("DD/MM/YYYY")}</div>
      </div>

      <div class="header-section">
        <div class="patient-info"><span class="info-label">Patient Name:</span> ${patientInfo?.fullName || "N/A"}</div>
        <div class="patient-info"><span class="info-label">MR Number:</span> ${patientInfo?.mrNo || "N/A"}</div>
        <div class="patient-info"><span class="info-label">Visit Number:</span> #${visitNumber}</div>
      </div>

      ${servicesHTML}

      <div class="signature-section">
        <div style="margin-top: 60px;">
          <div>___________________________________</div>
          <div>Healthcare Provider's Signature</div>
          <div style="margin-top: 20px;">Date: ${dayjs().format("DD/MM/YYYY")}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printVisitReport = (visitData: any, visitNumber: number) => {
  const content = generatePDFContent(visitData, visitData?.patient, visitNumber);
  const printWindow = window.open("", "_blank");

  if (!printWindow) return;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

const renderServiceDetails = (service: any, serviceName: string, key: string) => {
  const renderObjectAsDescriptions = (obj: any, title: string) => {
    if (!obj) return null;

    const formatLabel = (fieldKey: string) => {
      return fieldKey
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim()
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    return (
      <Card size="small" title={title} style={{ marginBottom: 16 }}>
        <Descriptions bordered size="small" column={2}>
          {Object.entries(obj).map(([fieldKey, value]) => {
            if (["id", "createdAt", "updatedAt"].includes(fieldKey)) return null;

            let displayValue: any = value;
            let label = formatLabel(fieldKey);

            if (
              fieldKey === "lmp" ||
              fieldKey === "expected_date_of_delivery" ||
              fieldKey === "resultLabDate"
            ) {
              displayValue = value ? dayjs(value as string).format("DD/MM/YYYY") : "N/A";
            } else if (fieldKey === "previous_pregnancies" && Array.isArray(value)) {
              return (
                <Descriptions.Item key={fieldKey} label={label} span={2}>
                  <div style={{ marginTop: 8 }}>
                    {(value as any[]).map((pregnancy: any, idx: number) => (
                      <Card
                        key={idx}
                        size="small"
                        style={{
                          marginBottom: 8,
                          background: "#fafafa",
                          border: "1px solid #e8e8e8",
                        }}
                      >
                        <div style={{ marginBottom: 4 }}>
                          <strong>Pregnancy {idx + 1}</strong>
                        </div>
                        <Descriptions size="small" column={1} bordered>
                          <Descriptions.Item label="Place of Delivery">
                            {pregnancy.place_of_delivery || "N/A"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Mode of Delivery">
                            {pregnancy.mode_of_delivery || "N/A"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Outcome">
                            {pregnancy.outcome || "N/A"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Complications">
                            {pregnancy.complication && Array.isArray(pregnancy.complication)
                              ? pregnancy.complication.join(", ")
                              : "None"}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    ))}
                  </div>
                </Descriptions.Item>
              );
            } else if (Array.isArray(value)) {
              if (fieldKey === "labTestsPrescribed") {
                return (
                  <Descriptions.Item key={fieldKey} label={label} span={2}>
                    <div>
                      {(value as any[]).map((test: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 4 }}>
                          <span>{test.name}</span>
                          <Tag
                            color={test.urgency === "Urgent" ? "red" : "blue"}
                            style={{ marginLeft: 8 }}
                          >
                            {test.urgency}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </Descriptions.Item>
                );
              }
              displayValue = value.length > 0 ? value.join(", ") : "N/A";
            } else if (typeof value === "boolean") {
              displayValue = value ? "Yes" : "No";
            } else if (value === null || value === undefined || value === "") {
              displayValue = "N/A";
            } else if (typeof value === "object") {
              displayValue = JSON.stringify(value);
            }

            return (
              <Descriptions.Item key={fieldKey} label={label} span={2}>
                {String(displayValue)}
              </Descriptions.Item>
            );
          })}
        </Descriptions>
      </Card>
    );
  };

  return (
    <Tabs.TabPane tab={serviceName.replace(/_/g, " ")} key={key}>
      <div style={{ maxHeight: "500px", overflowY: "auto", paddingRight: 8 }}>
        <Card size="small" title="Service Information" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <span style={{ fontWeight: 500 }}>Status: </span>
              <Tag color={service.status === "completed" ? "green" : "blue"}>
                {service.status?.toUpperCase() || "N/A"}
              </Tag>
            </Col>
            <Col span={12}>
              <span style={{ fontWeight: 500 }}>Date: </span>
              {dayjs(service.createdAt).format("DD/MM/YYYY HH:mm")}
            </Col>
          </Row>
        </Card>

        {service.familyPlanning &&
          renderObjectAsDescriptions(service.familyPlanning, "Family Planning Information")}
        {service.pregnancyInfo &&
          renderObjectAsDescriptions(service.pregnancyInfo, "Pregnancy Information")}
        {service.ancMedicalSurgicalHistory &&
          renderObjectAsDescriptions(
            service.ancMedicalSurgicalHistory,
            "Medical & Surgical History",
          )}
        {service.opdMedicalHistory &&
          renderObjectAsDescriptions(service.opdMedicalHistory, "OPD Medical History")}
        {service.ancVitalAssessment &&
          renderObjectAsDescriptions(service.ancVitalAssessment, "ANC Vital Assessment")}
        {service.pncVitalAssessment &&
          renderObjectAsDescriptions(service.pncVitalAssessment, "PNC Vital Assessment")}
        {service.nutritionVitalAssessment &&
          renderObjectAsDescriptions(
            service.nutritionVitalAssessment,
            "Nutrition Vital Assessment",
          )}
        {service.opdVitals && renderObjectAsDescriptions(service.opdVitals, "OPD Vitals")}
        {service.diagnosis &&
          renderObjectAsDescriptions(service.diagnosis, "Diagnosis & Screening")}
        {service.opdDiagnosis &&
          renderObjectAsDescriptions(service.opdDiagnosis, "OPD Diagnosis")}
        {service.ultrasound && renderObjectAsDescriptions(service.ultrasound, "Ultrasound")}
        {service.ctg &&
          renderObjectAsDescriptions(service.ctg, "Cardiotocography (CTG)")}
        {service.pncBreastfeeding &&
          renderObjectAsDescriptions(service.pncBreastfeeding, "PNC Breastfeeding")}
        {service.pncFamilyPlanning &&
          renderObjectAsDescriptions(service.pncFamilyPlanning, "PNC Family Planning")}
        {service.pncNutrition &&
          renderObjectAsDescriptions(service.pncNutrition, "PNC Nutrition")}
        {service.nutritionServiceInfo &&
          renderObjectAsDescriptions(
            service.nutritionServiceInfo,
            "Nutrition Service Information",
          )}
        {service.preDeliveryAssesment &&
          renderObjectAsDescriptions(service.preDeliveryAssesment, "Pre-Delivery Assessment")}

        {service.postDeliveryAssesment && (
          <Card size="small" title="Post-Delivery Assessment" style={{ marginBottom: 16 }}>
            <Descriptions bordered size="small" column={2}>
              {Object.entries(service.postDeliveryAssesment).map(([fieldKey, value]) => {
                if (
                  ["id", "createdAt", "updatedAt", "medicinesAdministered"].includes(
                    fieldKey,
                  )
                ) {
                  return null;
                }

                const formattedLabel = fieldKey
                  .replace(/([A-Z])/g, " $1")
                  .replace(/_/g, " ")
                  .trim()
                  .toLowerCase()
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

                return (
                  <Descriptions.Item key={fieldKey} label={formattedLabel} span={2}>
                    {formatValue(value)}
                  </Descriptions.Item>
                );
              })}
            </Descriptions>

            {service.postDeliveryAssesment.medicinesAdministered &&
              service.postDeliveryAssesment.medicinesAdministered.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <strong>Medicines Administered:</strong>
                  <Table
                    size="small"
                    dataSource={service.postDeliveryAssesment.medicinesAdministered}
                    pagination={false}
                    rowKey={(_, idx) => `med-${idx}`}
                    columns={[
                      {
                        title: "Medicine Name",
                        dataIndex: "medicineVariant",
                        key: "medicineName",
                        render: (variant) => (
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {variant?.medicine?.name || "N/A"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#888" }}>
                              {variant?.medicine?.generic_name || ""}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Form & Strength",
                        dataIndex: "medicineVariant",
                        key: "formStrength",
                        render: (variant) => (
                          <div>
                            <div>{variant?.unit || "N/A"}</div>
                            <div style={{ fontSize: "12px", color: "#888" }}>
                              {variant?.strength || "N/A"}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: "Quantity",
                        dataIndex: "quantity",
                        key: "quantity",
                      },
                    ]}
                  />
                </div>
              )}
          </Card>
        )}

        {service.newbornAssesment && service.newbornAssesment.length > 0 && (
          <Card size="small" title="Newborn Assessment" style={{ marginBottom: 16 }}>
            {service.newbornAssesment.map((newborn: any, index: number) => (
              <Card
                key={index}
                size="small"
                type="inner"
                title={`Newborn ${index + 1}`}
                style={{ marginBottom: 12 }}
              >
                <Descriptions bordered size="small" column={2}>
                  {Object.entries(newborn).map(([fieldKey, value]) => {
                    if (
                      ["id", "createdAt", "updatedAt", "medicinesAdministered"].includes(
                        fieldKey,
                      )
                    ) {
                      return null;
                    }

                    const formattedLabel = fieldKey
                      .replace(/([A-Z])/g, " $1")
                      .replace(/_/g, " ")
                      .trim()
                      .toLowerCase()
                      .split(" ")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ");

                    return (
                      <Descriptions.Item key={fieldKey} label={formattedLabel} span={2}>
                        {formatValue(value)}
                      </Descriptions.Item>
                    );
                  })}
                </Descriptions>

                {newborn.medicinesAdministered && newborn.medicinesAdministered.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <strong>Medicines Administered:</strong>
                    <Table
                      size="small"
                      dataSource={newborn.medicinesAdministered}
                      pagination={false}
                      rowKey={(_, idx) => `newborn-med-${idx}`}
                      columns={[
                        {
                          title: "Medicine Name",
                          dataIndex: "medicineVariant",
                          key: "medicineName",
                          render: (variant) => (
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {variant?.medicine?.name || "N/A"}
                              </div>
                              <div style={{ fontSize: "12px", color: "#888" }}>
                                {variant?.medicine?.generic_name || ""}
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Form & Strength",
                          dataIndex: "medicineVariant",
                          key: "formStrength",
                          render: (variant) => (
                            <div>
                              <div>{variant?.unit || "N/A"}</div>
                              <div style={{ fontSize: "12px", color: "#888" }}>
                                {variant?.strength || "N/A"}
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Quantity",
                          dataIndex: "quantity",
                          key: "quantity",
                        },
                      ]}
                    />
                  </div>
                )}
              </Card>
            ))}
          </Card>
        )}

        {service.deliveryDischargeDetails &&
          renderObjectAsDescriptions(service.deliveryDischargeDetails, "Delivery Discharge Details")}

        {service.deliveryReferralDetails && service.deliveryReferralDetails.length > 0 && (
          <Card size="small" title="Delivery Referral Details" style={{ marginBottom: 16 }}>
            {service.deliveryReferralDetails.map((referral: any, index: number) => (
              <Card
                key={index}
                size="small"
                type="inner"
                title={`Referral ${index + 1}`}
                style={{ marginBottom: 12 }}
              >
                <Descriptions bordered size="small" column={2}>
                  {Object.entries(referral).map(([fieldKey, value]) => {
                    if (["id", "createdAt", "updatedAt"].includes(fieldKey)) return null;

                    const formattedLabel = fieldKey
                      .replace(/([A-Z])/g, " $1")
                      .replace(/_/g, " ")
                      .trim()
                      .toLowerCase()
                      .split(" ")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ");

                    return (
                      <Descriptions.Item key={fieldKey} label={formattedLabel} span={2}>
                        {formatValue(value)}
                      </Descriptions.Item>
                    );
                  })}
                </Descriptions>
              </Card>
            ))}
          </Card>
        )}

        {service.dispenser && (
          <Card size="small" title="Medicine Dispensing" style={{ marginBottom: 16 }}>
            <Descriptions
              bordered
              size="small"
              column={2}
              style={{ marginBottom: 12 }}
            >
              <Descriptions.Item label="Dispensed By" span={2}>
                {service.dispenser.dispensedBy
                  ? `${service.dispenser.dispensedBy.first_name} ${service.dispenser.dispensedBy.last_name}`
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="OTC Required">
                <Tag color={service.dispenser.otcMedRequired ? "orange" : "green"}>
                  {service.dispenser.otcMedRequired ? "Yes" : "No"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Remarks">
                {service.dispenser.remarks || "N/A"}
              </Descriptions.Item>
            </Descriptions>

            {service.dispenser.items && service.dispenser.items.length > 0 && (
              <div>
                <strong style={{ display: "block", marginBottom: 8 }}>
                  Dispensed Medicines:
                </strong>
                <Table
                  size="small"
                  dataSource={service.dispenser.items}
                  pagination={false}
                  rowKey={(_, index) => `dispense-${index}`}
                  columns={[
                    {
                      title: "Medicine Name",
                      dataIndex: "medicineVariant",
                      key: "medicineName",
                      render: (medicineVariant) => (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {medicineVariant?.medicine?.name || "N/A"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {medicineVariant?.medicine?.generic_name || ""}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Form & Strength",
                      dataIndex: "medicineVariant",
                      key: "formStrength",
                      render: (medicineVariant) => (
                        <div>
                          <div>{medicineVariant?.unit || "N/A"}</div>
                          <div style={{ fontSize: "12px", color: "#888" }}>
                            {medicineVariant?.strength || "N/A"}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: "Batch Number",
                      dataIndex: "batch",
                      key: "batchNumber",
                      render: (batch) => batch?.batch_number || "N/A",
                    },
                    {
                      title: "Dispensed Qty",
                      dataIndex: "dispensed_qty",
                      key: "dispensedQty",
                    },
                    {
                      title: "Expiry Date",
                      dataIndex: "batch",
                      key: "expiryDate",
                      render: (batch) =>
                        batch?.expiry_date ? dayjs(batch.expiry_date).format("DD/MM/YYYY") : "N/A",
                    },
                    {
                      title: "OTC",
                      dataIndex: "otc",
                      key: "otc",
                      render: (otc) => <Tag color={otc ? "orange" : "blue"}>{otc ? "Yes" : "No"}</Tag>,
                    },
                  ]}
                />
              </div>
            )}
          </Card>
        )}

        {service.immunisations && service.immunisations.length > 0 && (
          <Card size="small" title="Immunisations" style={{ marginBottom: 16 }}>
            {service.immunisations.map((immunisation: any, index: number) => (
              <Card key={index} size="small" type="inner" style={{ marginBottom: 12 }}>
                {immunisation.immunisationCard && (
                  <Descriptions
                    bordered
                    size="small"
                    column={2}
                    style={{ marginBottom: 12 }}
                  >
                    <Descriptions.Item label="Place of Delivery" span={2}>
                      {immunisation.immunisationCard.placeOfDelivery || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Other Place">
                      {immunisation.immunisationCard.otherPlace || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Level of Care">
                      {immunisation.immunisationCard.level_of_care || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Other Facility Name" span={2}>
                      {immunisation.immunisationCard.otherFacilityName || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Card Available">
                      <Tag
                        color={
                          immunisation.immunisationCard.immunisationCardAvailable
                            ? "green"
                            : "red"
                        }
                      >
                        {immunisation.immunisationCard.immunisationCardAvailable ? "Yes" : "No"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="EPI Card Provided">
                      <Tag
                        color={
                          immunisation.immunisationCard.epiCardProvided ? "green" : "red"
                        }
                      >
                        {immunisation.immunisationCard.epiCardProvided ? "Yes" : "No"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="EPI Number" span={2}>
                      {immunisation.immunisationCard.epiNumber || "N/A"}
                    </Descriptions.Item>
                  </Descriptions>
                )}

                <div style={{ marginTop: 12 }}>
                  <strong style={{ fontSize: "14px", marginBottom: 8, display: "block" }}>
                    Vaccines Administered:
                  </strong>
                  {immunisation.doses && immunisation.doses.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {immunisation.doses.map((dose: any, doseIdx: number) => {
                        const vaccine = dose.vaccine;
                        return (
                          <Card
                            key={doseIdx}
                            size="small"
                            style={{ background: "#fafafa", border: "1px solid #e8e8e8" }}
                          >
                            <div style={{ marginBottom: 8 }}>
                              <Tag color="blue">Dose {doseIdx + 1}</Tag>
                            </div>
                            <Descriptions size="small" column={1} bordered>
                              <Descriptions.Item label="Vaccine Name">
                                <strong>{vaccine?.display_name || vaccine?.code || "N/A"}</strong>
                              </Descriptions.Item>
                              <Descriptions.Item label="Vaccine Code">
                                {vaccine?.code || "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Date Administered">
                                {dose.dateAdministered
                                  ? dayjs(dose.dateAdministered).format("DD/MM/YYYY")
                                  : "N/A"}
                              </Descriptions.Item>
                              <Descriptions.Item label="Status">
                                <Tag color={dose.status === "Administered" ? "green" : "orange"}>
                                  {dose.status || "N/A"}
                                </Tag>
                              </Descriptions.Item>
                              {vaccine?.applies_to && (
                                <Descriptions.Item label="Applies To">
                                  {vaccine.applies_to}
                                </Descriptions.Item>
                              )}
                              {vaccine?.dose_number !== undefined && (
                                <Descriptions.Item label="Dose Number">
                                  {vaccine.dose_number}
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "#999",
                        padding: "12px",
                        background: "#fafafa",
                        borderRadius: "4px",
                      }}
                    >
                      No vaccines administered
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </Card>
        )}

        {service.prescriptions && service.prescriptions.length > 0 && (
          <Card size="small" title="Prescriptions" style={{ marginBottom: 16 }}>
            <Table
              size="small"
              dataSource={service.prescriptions}
              pagination={false}
              rowKey={(_, index) => `prescription-${index}`}
              columns={[
                {
                  title: "Medicine Name",
                  dataIndex: "medicineVariant",
                  key: "medicineName",
                  render: (medicineVariant) => (
                    <div>
                      <div style={{ fontWeight: 600, color: "#262626" }}>
                        {medicineVariant?.medicine?.name || "N/A"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        {medicineVariant?.medicine?.generic_name || ""}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Form & Strength",
                  dataIndex: "medicineVariant",
                  key: "formStrength",
                  render: (medicineVariant) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{medicineVariant?.unit || "N/A"}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        {medicineVariant?.strength || "N/A"}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Dosage",
                  dataIndex: "medicineDosage",
                  key: "dosage",
                  render: (val) => val || "N/A",
                },
                {
                  title: "Duration",
                  dataIndex: "medicineDuration",
                  key: "duration",
                  render: (val) => (val ? `${val} days` : "N/A"),
                },
                {
                  title: "Quantity",
                  dataIndex: "quantity",
                  key: "quantity",
                  render: (val) => val || "N/A",
                },
                {
                  title: "Instructions",
                  dataIndex: "medicineInstruction",
                  key: "instructions",
                  render: (val) => val || "N/A",
                },
                {
                  title: "Dispensed",
                  dataIndex: "medicineDispensed",
                  key: "dispensed",
                  render: (val) => <Tag color={val ? "green" : "red"}>{val ? "Yes" : "No"}</Tag>,
                },
              ]}
            />
          </Card>
        )}
      </div>
    </Tabs.TabPane>
  );
};

const VisitReportModal: React.FC<VisitReportModalProps> = ({
  open,
  visitId,
  visitNumber,
  onClose,
}) => {
  const [activeTabKey, setActiveTabKey] = useState<string>("0");
  const [getVisitDetails, { data: visitDetails, isLoading: isLoadingVisit }] =
    useLazyGetVisitDetailsQuery();

  useEffect(() => {
    if (!open || !visitId) return;

    const loadVisitDetails = async () => {
      const result = await getVisitDetails(visitId);
      const visitData = result.data;
      setActiveTabKey(getDefaultTabKey(visitData));
    };

    loadVisitDetails();
  }, [getVisitDetails, open, visitId]);

  const handlePrint = async () => {
    if (!visitId) return;

    let visitData = visitDetails;
    if (!visitData || visitData.visitId !== visitId) {
      const result = await getVisitDetails(visitId);
      visitData = result.data;
    }

    if (!visitData) return;

    const resolvedVisitNumber = visitNumber || visitData.visitNumber || visitId;
    printVisitReport(visitData, resolvedVisitNumber);
  };

  const handleClose = () => {
    setActiveTabKey("0");
    onClose();
  };

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: "40px",
          }}
        >
          <div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              Visit Report - #{visitNumber || visitDetails?.visitNumber || visitId}
            </div>
            <div style={{ fontSize: "14px", color: "#666", marginTop: 4 }}>
              {visitDetails?.patient?.fullName}
              <span style={{ margin: "0 8px" }}>•</span>
              MR: {visitDetails?.patient?.mrNo}
              <span style={{ margin: "0 8px" }}>•</span>
              Visit: #{visitNumber || visitDetails?.visitNumber || visitId}
            </div>
          </div>
          <div style={{ textAlign: "right", marginRight: "8px" }}>
            <div style={{ fontSize: "14px" }}>
              {visitDetails?.visitDate ? dayjs(visitDetails.visitDate).format("DD MMM YYYY") : "—"}
            </div>
            <Tag color="blue" style={{ marginTop: 4 }}>
              {visitDetails?.visitStatus?.toUpperCase()}
            </Tag>
          </div>
        </div>
      }
      open={open}
      onCancel={handleClose}
      width={1200}
      footer={[
        <Button
          key="print"
          icon={<FileTextOutlined />}
          onClick={handlePrint}
          loading={isLoadingVisit}
        >
          Print Report
        </Button>,
        <Button key="close" onClick={handleClose}>
          Close
        </Button>,
      ]}
      closeIcon={<CloseOutlined />}
    >
      {isLoadingVisit ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 256,
          }}
        >
          <Spin size="large" tip="Loading visit details..." />
        </div>
      ) : visitDetails ? (
        <div>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[24, 12]}>
              <Col span={8}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Gender:</strong> {visitDetails.patient?.gender || "N/A"}
                </div>
                <div>
                  <strong>CNIC:</strong> {visitDetails.patient?.cnic || "N/A"}
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Age:</strong> {visitDetails.patient?.age || "N/A"}
                </div>
                <div>
                  <strong>EPI Number:</strong> {visitDetails.patient?.epiNumber || "N/A"}
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Phone:</strong> {visitDetails.patient?.phoneNumber || "N/A"}
                </div>
                <div>
                  <strong>Address:</strong> {visitDetails.patient?.address || "N/A"}
                </div>
              </Col>
            </Row>
          </Card>

          {visitDetails.appointments && visitDetails.appointments.length > 0 ? (
            <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} type="card" size="middle">
              {visitDetails.appointments.flatMap((appointment: any, appIndex: number) => {
                const services = appointment.services || {};
                return Object.keys(services)
                  .map((serviceName, serviceIndex) => {
                    const serviceData = services[serviceName];
                    if (!serviceData || serviceData.length === 0) return null;

                    const service = serviceData[0];
                    const key = `${appIndex}-${serviceIndex}`;

                    return renderServiceDetails(service, serviceName, key);
                  })
                  .filter(Boolean);
              })}
            </Tabs>
          ) : (
            <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
              No service details available for this visit
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 32, color: "#999" }}>
          No visit details available
        </div>
      )}
    </Modal>
  );
};

export default VisitReportModal;
