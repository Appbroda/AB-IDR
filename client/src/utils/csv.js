export const downloadApplovinCSV = (data, filename) => {
  if (!data) {
    console.warn("No data available to convert to CSV.");
    return;
  }

  let csvRows = [];

  // Detect if this is the final phase response (which contains 'status' objects)
  const hasStatus =
    (data.waterfallUnits && data.waterfallUnits.some((u) => u.status)) ||
    (data.abUnits && data.abUnits.some((u) => u.status));

  // Helpers to safely extract data without optional chaining
  const getSuccessStr = (statusObj) => {
    if (statusObj && typeof statusObj.success !== "undefined") {
      return statusObj.success ? "TRUE" : "FALSE";
    }
    return "";
  };

  const getErrorStr = (statusObj) => {
    const errorMsg =
      statusObj &&
      (statusObj.error || statusObj.errorMessage || statusObj.message);
    if (errorMsg) {
      return `"${String(errorMsg).replace(/"/g, '""')}"`;
    }
    return "";
  };

  // Row Builders that adapt to the detected phase
  const buildGroupRow = (groupHeader, statusObj) => {
    if (hasStatus) {
      return `${getSuccessStr(statusObj)},"${groupHeader}",,${getErrorStr(statusObj)}`;
    }
    // Phase 1 layout (2 columns)
    return `"${groupHeader}",`;
  };

  const buildDataRow = (prevId, newId, statusObj) => {
    if (hasStatus) {
      return `${getSuccessStr(statusObj)},"${prevId}","${newId}",${getErrorStr(statusObj)}`;
    }
    // Phase 1 layout (2 columns)
    return `"${prevId}","${newId}"`;
  };

  // 1. Process Waterfall Units
  if (data.waterfallUnits && data.waterfallUnits.length > 0) {
    if (hasStatus) {
      csvRows.push("Waterfall Ad unit changes,,,");
      csvRows.push("success,prevId,newId,Error Message");
    } else {
      csvRows.push("Waterfall Ad unit changes,");
      csvRows.push("prevId,newId");
    }

    data.waterfallUnits.forEach((unit) => {
      const groupHeader = `App - ${unit.package_name} || Format - ${unit.ad_format} || MAX Ad unit Id - ${unit.id}`;

      csvRows.push(buildGroupRow(groupHeader, unit.status));

      if (unit.adUnits && unit.adUnits.length > 0) {
        unit.adUnits.forEach((adUnit) => {
          csvRows.push(buildDataRow(adUnit.prevId, adUnit.newId, unit.status));
        });
      }
    });
  }

  // 2. Process A/B Experiment Units
  if (data.abUnits && data.abUnits.length > 0) {
    // Add visual spacing between Waterfall and A/B Test sections
    csvRows.push(hasStatus ? ",,," : ",");

    if (hasStatus) {
      csvRows.push("A/B Test Ad unit changes,,,");
      csvRows.push("success,prevId,newId,Error Message");
    } else {
      csvRows.push("A/B Test Ad unit changes,");
      csvRows.push("prevId,newId");
    }

    data.abUnits.forEach((unit) => {
      const groupHeader = `App - ${unit.package_name} || Format - ${unit.ad_format} || MAX Ad unit Id - ${unit.id} || Experiment - ${unit.experiment_name}`;

      csvRows.push(buildGroupRow(groupHeader, unit.status));

      if (unit.adUnits && unit.adUnits.length > 0) {
        unit.adUnits.forEach((adUnit) => {
          csvRows.push(buildDataRow(adUnit.prevId, adUnit.newId, unit.status));
        });
      }
    });
  }

  // Generate the Blob and Download
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function downloadCsv(rows, fileName) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function downloadIronsourceCSV(data) {
  const rows = [];

  data.forEach(({ appKey, instances }) => {
    if (rows.length) rows.push([]);

    rows.push([`App: ${appKey}`]);
    rows.push(["Previous", "Next"]);

    instances.forEach(({ current, new: next }) => {
      rows.push([current, next]);
    });
  });

  downloadCsv(rows, "ironsource-ad-units.csv");
}

export function downloadUpdateResultsCsv(results) {
  const rows = [];

  results.forEach(({ previousValue, nextValue, isSuccess }) => {
    if (nextValue === "-") {
      if (rows.length) rows.push([]);

      rows.push([`App: ${previousValue}`]);
      rows.push(["Status", "Previous", "Next"]);
      return;
    }

    rows.push([isSuccess ? "Success" : "Failed", previousValue, nextValue]);
  });

  downloadCsv(rows, "ironsource-update-results.csv");
}

export const downloadTradplusCSV = (
  data,
  filename = "tradplus_updates.csv",
) => {
  if (!data || !data.units || data.units.length === 0) {
    console.warn("No data available to download.");
    alert("No data available to download.");
    return;
  }

  const { units } = data;

  const headers = [
    "TradPlus ID",
    "Previous Placement ID",
    "New Placement ID",
    "Status",
  ];

  const rows = [headers.join(",")];

  units.forEach((unit) => {
    const id = unit.id || "";
    const adUnits = unit.adUnits || [];

    adUnits.forEach((subUnit) => {
      const prevId = subUnit.prevId || "";
      const newId = subUnit.newId || "";

      let statusStr = "Pending/Preview";
      if (unit.status) {
        if (unit.status.success) {
          statusStr = "Success";
        } else {
          statusStr = JSON.stringify(unit.status).replace(/"/g, '""');
          statusStr = `"${statusStr}"`;
        }
      }

      rows.push([id, prevId, newId, statusStr].join(","));
    });
  });

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
