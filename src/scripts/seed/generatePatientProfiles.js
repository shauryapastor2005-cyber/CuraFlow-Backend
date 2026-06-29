import { faker } from "@faker-js/faker";

const generatePatientProfiles = (caregivers) => {
  try {
    console.log("Generating patient profiles...");

    const caregiverPatientCounts = [5, 8, 7];
    const historyLengths = [
      "30 days",
      "30 days",
      "30 days",
      "30 days",
      "30 days",
      "30 days",
      "30 days",
      "30 days",
      "6 months",
      "6 months",
      "6 months",
      "6 months",
      "6 months",
      "6 months",
      "1 year",
      "1 year",
      "1 year",
      "1 year",
      "7 days",
      "7 days",
    ];
    const severities = [
      "Critical",
      "Critical",
      "Severe",
      "Severe",
      "Severe",
      "Severe",
      "Severe",
      "Moderate",
      "Moderate",
      "Moderate",
      "Moderate",
      "Moderate",
      "Moderate",
      "Moderate",
      "Moderate",
      "Mild",
      "Mild",
      "Mild",
      "Mild",
      "Mild",
    ];
    const strokeTypes = [
      "Ischemic",
      "Ischemic",
      "Ischemic",
      "Ischemic",
      "Ischemic",
      "Ischemic",
      "Ischemic",
      "Ischemic",
      "Hemorrhagic",
      "Hemorrhagic",
      "Hemorrhagic",
      "Hemorrhagic",
      "TIA",
      "TIA",
      "TIA",
      "Brainstem",
      "Brainstem",
      "Cerebellar",
      "Cerebellar",
      "Ischemic",
    ];
    const severityProfiles = {
      Critical: {
        mobilityStatus: "Bedridden",
        speechStatus: "Non-verbal",
        cognitionStatus: "Needs full-time supervision",
        requiresVentilator: true,
        hasTracheostomy: true,
        bedridden: true,
        feedingTube: true,
        recoveryTrend: "Slow Recovery",
      },
      Severe: {
        mobilityStatus: "Wheelchair assisted",
        speechStatus: "Slurred",
        cognitionStatus: "Confused at times",
        requiresVentilator: false,
        hasTracheostomy: false,
        bedridden: false,
        feedingTube: true,
        recoveryTrend: "Slow Recovery",
      },
      Moderate: {
        mobilityStatus: "Walker assisted",
        speechStatus: "Mild aphasia",
        cognitionStatus: "Mild memory issues",
        requiresVentilator: false,
        hasTracheostomy: false,
        bedridden: false,
        feedingTube: false,
        recoveryTrend: "Improving",
      },
      Mild: {
        mobilityStatus: "Independent",
        speechStatus: "Clear",
        cognitionStatus: "Alert",
        requiresVentilator: false,
        hasTracheostomy: false,
        bedridden: false,
        feedingTube: false,
        recoveryTrend: "Stable",
      },
    };
    const comorbidityGroups = [
      ["Hypertension"],
      ["Diabetes"],
      ["High cholesterol"],
      ["Hypertension", "Diabetes"],
      ["Atrial fibrillation"],
    ];

    const profiles = [];

    caregivers.forEach((caregiver, caregiverIndex) => {
      for (let i = 0; i < caregiverPatientCounts[caregiverIndex]; i += 1) {
        const profileIndex = profiles.length;
        const gender = faker.helpers.arrayElement(["male", "female"]);
        const age = faker.number.int({ min: 50, max: 90 });
        const historyLength = historyLengths[profileIndex];
        const severity = severities[profileIndex];
        const severityProfile = severityProfiles[severity];
        const recoveryStartDate = new Date();

        if (historyLength === "7 days") {
          recoveryStartDate.setUTCDate(recoveryStartDate.getUTCDate() - 7);
        }

        if (historyLength === "30 days") {
          recoveryStartDate.setUTCDate(recoveryStartDate.getUTCDate() - 30);
        }

        if (historyLength === "6 months") {
          recoveryStartDate.setUTCMonth(recoveryStartDate.getUTCMonth() - 6);
        }

        if (historyLength === "1 year") {
          recoveryStartDate.setUTCFullYear(
            recoveryStartDate.getUTCFullYear() - 1
          );
        }

        profiles.push({
          caregiver,
          fullname: faker.person.fullName(),
          age,
          gender,
          phone: faker.phone.number(),
          address: {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            pincode: faker.location.zipCode(),
          },
          emergencyContact: {
            name: faker.person.fullName(),
            phone: faker.phone.number(),
            relation: faker.helpers.arrayElement(["Spouse", "Child", "Sibling"]),
          },
          strokeType: strokeTypes[profileIndex],
          severity,
          recoveryDuration: historyLength,
          recoveryTrend: severityProfile.recoveryTrend,
          mobilityStatus: severityProfile.mobilityStatus,
          speechStatus: severityProfile.speechStatus,
          cognitionStatus: severityProfile.cognitionStatus,
          requiresVentilator: severityProfile.requiresVentilator,
          hasTracheostomy: severityProfile.hasTracheostomy,
          bedridden: severityProfile.bedridden,
          feedingTube: severityProfile.feedingTube,
          comorbidities: faker.helpers.arrayElement(comorbidityGroups),
          historyLength,
          recoveryStartDate,
        });
      }
    });

    console.log("20 patient profiles generated.");

    return profiles;
  } catch (error) {
    console.error("Failed to generate patient profiles:", error.message);
    throw error;
  }
};

export { generatePatientProfiles };
