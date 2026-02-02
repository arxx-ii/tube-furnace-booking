
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_NAME = 'bookings';

function doGet(e) {
  const date = e.parameter.date; // Expects YYYY-MM-DD
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const dayStart = date + "T00:00:00";
  const dayEnd = date + "T23:59:59.999";

  const bookings = data
    .map(row => {
      const b = {};
      headers.forEach((h, i) => b[h] = row[i]);
      return b;
    })
    .filter(b => {
      // Overlap logic: start < dayEnd AND end > dayStart
      return b.startDateTime < dayEnd && b.endDateTime > dayStart;
    });

  return ContentService.createTextOutput(JSON.stringify({ success: true, data: bookings }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    
    if (action === 'CREATE') {
      return createBooking(postData, sheet);
    } else if (action === 'UPDATE') {
      return updateBooking(postData, sheet);
    } else if (action === 'DELETE') {
      return deleteBooking(postData, sheet);
    }
    
    return createJsonResponse(false, 'Invalid action');
  } catch (err) {
    return createJsonResponse(false, err.toString());
  }
}

function createBooking(data, sheet) {
  if (hasConflict(data.startDateTime, data.endDateTime, null, sheet)) {
    return createJsonResponse(false, 'Time slot conflict');
  }
  
  const id = Utilities.getUuid();
  const createdAt = new Date().toISOString();
  
  // Model: id, startDateTime, endDateTime, name, sample, gas, notes, (empty hash field), createdAt
  sheet.appendRow([
    id, 
    data.startDateTime, 
    data.endDateTime, 
    data.name, 
    data.sample, 
    data.gas, 
    data.notes || '', 
    '', // Removed editCodeHash
    createdAt
  ]);
  
  return createJsonResponse(true, 'Booking created');
}

function updateBooking(data, sheet) {
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      rowIndex = i + 1; // 1-based index for getRange
      break;
    }
  }
  
  if (rowIndex === -1) return createJsonResponse(false, 'Booking not found');
  if (hasConflict(data.startDateTime, data.endDateTime, data.id, sheet)) {
    return createJsonResponse(false, 'New time slot overlaps');
  }
  
  // Update columns: 2:startDateTime, 3:endDateTime, 4:name, 5:sample, 6:gas, 7:notes
  sheet.getRange(rowIndex, 2, 1, 6).setValues([[
    data.startDateTime, data.endDateTime, data.name, data.sample, data.gas, data.notes || ''
  ]]);
  
  return createJsonResponse(true, 'Booking updated');
}

function deleteBooking(data, sheet) {
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return createJsonResponse(true, 'Booking deleted');
    }
  }
  return createJsonResponse(false, 'Booking not found');
}

function hasConflict(start, end, excludeId, sheet) {
  const data = sheet.getDataRange().getValues();
  data.shift(); 
  return data.some(row => {
    if (row[0] === excludeId) return false;
    const bStart = row[1];
    const bEnd = row[2];
    return !(end <= bStart || start >= bEnd);
  });
}

function createJsonResponse(success, message) {
  return ContentService.createTextOutput(JSON.stringify({ success, message }))
    .setMimeType(ContentService.MimeType.JSON);
}
