'use strict';
/**
 * excelService.js
 * Generates a Bullet Auto Performance "Cost Estimate" Excel workbook
 * that mirrors the official invoice template shown in the screenshot.
 *
 * Column layout (A–J, 10 columns):
 *  A(1)=14  B(2)=16  C(3)=9  D(4)=9  E(5)=14  F(6)=14  G(7)=12  H(8)=14  I(9)=12  J(10)=12
 *
 * Customer section (left half):  A = label, B:C:D merged = yellow value
 * Vehicle section  (right half): E = label, F:G:H:I:J merged = value
 * Payment row (right half):      E=EFT  F=CASH  G=CARD  H=RCS  I:J=FLEET
 * Items table:  A:E=DESC  F=QTY  G=blank  H:I=UNIT PRICE  J=NETT PRICE
 * System checks: A:B=name1 C=val1 D:E=name2 F=val2 G:H=name3 I:J=val3
 */

const ExcelJS = require('exceljs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  yellow:    'FFFF00',
  lightBlue: 'BDD7EE',
  midBlue:   '9DC3E6',
  titleBlue: '2F5496',
  white:     'FFFFFF',
  lightGrey: 'F2F2F2',
  altGrey:   'DAEEF3',
  green:     '00B050',
  red:       'FF0000',
  orange:    'C55A11',
  black:     '000000',
  headerBg:  '4472C4',
  darkBlue:  '1F3864',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fill(cell, color) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
}
function font(cell, { name = 'Calibri', size = 9, bold = false, color = C.black, italic = false, underline = false } = {}) {
  cell.font = { name, size, bold, italic, underline, color: { argb: 'FF' + color } };
}
function align(cell, h = 'left', v = 'middle', wrap = false) {
  cell.alignment = { horizontal: h, vertical: v, wrapText: wrap };
}
function border(cell, { top = 'thin', left = 'thin', bottom = 'thin', right = 'thin' } = {}) {
  const s = (style) => (style ? { style } : undefined);
  cell.border = { top: s(top), left: s(left), bottom: s(bottom), right: s(right) };
}
function thinBorder(cell) { border(cell); }

// Format currency as "R 1 045,00"
function rands(val) {
  if (val == null || val === '') return '';
  const n = Number(val);
  return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function boolLabel(val) { return val ? 'TRUE' : 'FALSE'; }
function boolColor(val) { return val ? C.green : C.red; }

// ─── Main export ─────────────────────────────────────────────────────────────
async function generateInvoiceExcel(invoice) {
  /* Expected invoice shape:
    {
      quote_no, date, in_date, out_date,
      customer: { name, att, phone, email, vat_no, address },
      vehicle:  { make, model, reg_no, vin_no, engine_no, odometer },
      payment:  { eft, cash, card, rcs, fleet },
      job_description, notes,
      items: [{ description, qty, unit_price, nett_price }],
      checks: { brakes, vbelts, wheel_bearings, cooling, oil_levels, lights, hand_brake, tyres, shocks, wipers, water_oil_leaks },
      banking: { company, bank, branch_code, account_number, ref_no },
      totals:  { subtotal, vat_rate, vat_amount, total }
    }
  */
  const inv = normalise(invoice);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BulletAuto';
  wb.created = new Date();

  const ws = wb.addWorksheet('Cost Estimate', {
    pageSetup: {
      paperSize: 9,           // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
    views: [{ showGridLines: false }],
  });

  // ─── Column widths ────────────────────────────────────────────────────────
  ws.columns = [
    { width: 14 }, // A 1
    { width: 16 }, // B 2
    { width: 9  }, // C 3
    { width: 9  }, // D 4
    { width: 14 }, // E 5
    { width: 14 }, // F 6
    { width: 12 }, // G 7
    { width: 14 }, // H 8
    { width: 12 }, // I 9
    { width: 12 }, // J 10
  ];

  let r = 1; // current row counter

  // ─── Helper: single-cell set ──────────────────────────────────────────────
  const C_ = (row, col) => ws.getCell(row, col);
  const M  = (r1, c1, r2, c2) => ws.mergeCells(r1, c1, r2, c2);
  const R  = (row) => ws.getRow(row);

  // ─── ROW 1: top spacer ────────────────────────────────────────────────────
  R(r).height = 8;
  r++;

  // ─── ROWS 2–4: Company name / logo area (left) + Address (right) ─────────
  // Left: company name spans A2:D4 (rows 2-4, cols 1-4)
  R(r).height = 22; R(r+1).height = 14; R(r+2).height = 14;
  M(r, 1, r+2, 4);
  const nameCell = C_(r, 1);
  nameCell.value = 'Bullet Auto Performance\n072 345 3221  |  www.bulletauto.co.za';
  font(nameCell, { name: 'Times New Roman', size: 15, bold: true });
  align(nameCell, 'center', 'middle', true);

  // Right: entire address block merged as one cell (rows 2-7, cols 6-10)
  // Using a single wrapped cell avoids merge conflicts with DATE/QUOTE on row 8+
  M(r, 6, r+5, 10);
  const addrCell = C_(r, 6);
  addrCell.value = [
    '7 Strand Road',
    'Labiance Bellville',
    'Cape Town, Western Cape, 7530',
    'Tel: 072 345 3221',
    'Email: admin@bulletauto.co.za',
    'Vat No: 4350295624   |   Reg No: 2019/423180/07',
  ].join('\n');
  font(addrCell, { size: 8 });
  align(addrCell, 'left', 'top', true);

  r += 3; // now at row 5

  // ─── ROWS 5–7: Associations (left side only — right is still part of address block) ──
  R(r).height = 18; R(r+1).height = 14; R(r+2).height = 14;
  M(r, 1, r, 4);
  const assocCell = C_(r, 1);
  assocCell.value = '[ RMI ]   [ miwa ]   [ MIO ]';
  font(assocCell, { size: 10, bold: true });
  align(assocCell, 'center', 'middle');

  r += 3; // now at row 8

  // ─── ROWS 8–10: DATE / QUOTE NO / IN / OUT ────────────────────────────────
  R(r).height = 16; R(r+1).height = 16; R(r+2).height = 16;

  // DATE header
  M(r, 7, r, 8);
  const dateHdr = C_(r, 7);
  dateHdr.value = 'DATE';
  fill(dateHdr, C.lightBlue); font(dateHdr, { bold: true, size: 9 }); align(dateHdr, 'center', 'middle'); thinBorder(dateHdr);

  // QUOTE NO header
  M(r, 9, r, 10);
  const quoteHdr = C_(r, 9);
  quoteHdr.value = 'QUOTE NO';
  fill(quoteHdr, C.lightBlue); font(quoteHdr, { bold: true, size: 9 }); align(quoteHdr, 'center', 'middle'); thinBorder(quoteHdr);

  // DATE value
  M(r+1, 7, r+1, 8);
  const dateVal = C_(r+1, 7);
  dateVal.value = inv.date;
  fill(dateVal, C.yellow); align(dateVal, 'center', 'middle'); thinBorder(dateVal); font(dateVal, { size: 9 });

  // QUOTE NO value
  M(r+1, 9, r+1, 10);
  const quoteVal = C_(r+1, 9);
  quoteVal.value = inv.quote_no;
  fill(quoteVal, C.yellow); align(quoteVal, 'center', 'middle'); thinBorder(quoteVal); font(quoteVal, { size: 9 });

  // IN label + value
  M(r+2, 7, r+2, 7);
  const inHdr = C_(r+2, 7);
  inHdr.value = 'IN'; font(inHdr, { bold: true, size: 9 }); align(inHdr, 'center', 'middle'); thinBorder(inHdr);

  const inVal = C_(r+2, 8);
  inVal.value = inv.in_date; align(inVal, 'center', 'middle'); thinBorder(inVal); font(inVal, { size: 9 });

  // OUT label + value
  const outHdr = C_(r+2, 9);
  outHdr.value = 'OUT'; font(outHdr, { bold: true, size: 9 }); align(outHdr, 'center', 'middle'); thinBorder(outHdr);

  const outVal = C_(r+2, 10);
  outVal.value = inv.out_date; align(outVal, 'center', 'middle'); thinBorder(outVal); font(outVal, { size: 9 });

  r += 3; // now row 11

  // ─── ROW 11: "Cost Estimate" title ────────────────────────────────────────
  R(r).height = 24;
  M(r, 1, r, 6);
  const titleCell = C_(r, 1);
  titleCell.value = 'Cost Estimate';
  font(titleCell, { name: 'Calibri', size: 18, bold: true, color: C.titleBlue });
  align(titleCell, 'left', 'middle');
  r++;

  // ─── ROW 12: "Vehicle Details" section header ─────────────────────────────
  R(r).height = 16;
  M(r, 1, r, 10);
  const vdHdr = C_(r, 1);
  vdHdr.value = 'Vehicle Details';
  fill(vdHdr, C.lightBlue); font(vdHdr, { bold: true, size: 9 }); align(vdHdr, 'center', 'middle'); thinBorder(vdHdr);
  r++;

  // ─── ROWS 13–20: Customer (left) + Vehicle (right) details ───────────────
  const customerRows = [
    { label: 'Name:', value: inv.customer.name },
    { label: 'Att',   value: inv.customer.att },
    { label: 'Phone:', value: inv.customer.phone },
    { label: 'Email:', value: inv.customer.email },
    { label: 'Vat No:', value: inv.customer.vat_no },
  ];
  const vehicleRows = [
    { label: 'Make:',   value: inv.vehicle.make, bold: true },
    { label: 'Model:',  value: inv.vehicle.model, bold: true },
    { label: 'Reg No:', value: inv.vehicle.reg_no, yellow: true },
    { label: 'Vin No:', value: inv.vehicle.vin_no, yellow: true },
    { label: 'Engine No:', value: inv.vehicle.engine_no, yellow: true },
  ];

  const firstDetailRow = r;
  for (let i = 0; i < 5; i++) {
    R(r + i).height = 16;
    // Customer left side
    const lbl = C_(r + i, 1);
    lbl.value = customerRows[i].label;
    font(lbl, { bold: true, size: 9 }); thinBorder(lbl); align(lbl, 'left', 'middle');

    M(r + i, 2, r + i, 4);
    const val = C_(r + i, 2);
    val.value = customerRows[i].value;
    fill(val, C.yellow); thinBorder(val); align(val, 'left', 'middle'); font(val, { size: 9 });

    // Vehicle right side
    const vlbl = C_(r + i, 5);
    vlbl.value = vehicleRows[i].label;
    font(vlbl, { bold: true, size: 9 }); thinBorder(vlbl); align(vlbl, 'left', 'middle');

    M(r + i, 6, r + i, 10);
    const vval = C_(r + i, 6);
    vval.value = vehicleRows[i].value;
    if (vehicleRows[i].yellow) fill(vval, C.yellow);
    font(vval, { bold: !!vehicleRows[i].bold, size: 9 });
    thinBorder(vval); align(vval, 'left', 'middle');
  }
  r += 5;

  // Row: Address (left, spans 2 rows) + Odometer (right) + Payment headers
  R(r).height = 16; R(r+1).height = 16;
  // Address label + value
  const addrLbl = C_(r, 1);
  addrLbl.value = 'Address:'; font(addrLbl, { bold: true, size: 9 }); thinBorder(addrLbl); align(addrLbl, 'left', 'middle');
  M(r, 2, r+1, 4);
  const addrVal = C_(r, 2);
  addrVal.value = inv.customer.address;
  fill(addrVal, C.yellow); thinBorder(addrVal); align(addrVal, 'left', 'top', true); font(addrVal, { size: 9 });

  // second address row left side (blank label cell, bordered)
  thinBorder(C_(r+1, 1));

  // Odometer right side
  const odomLbl = C_(r, 5);
  odomLbl.value = 'Odometer Reading: KM'; font(odomLbl, { bold: true, size: 9 }); thinBorder(odomLbl); align(odomLbl, 'left', 'middle');
  M(r, 6, r, 10);
  const odomVal = C_(r, 6);
  odomVal.value = inv.vehicle.odometer;
  fill(odomVal, C.yellow); thinBorder(odomVal); align(odomVal, 'left', 'middle'); font(odomVal, { size: 9 });

  // Payment headers row  (right side row r+1)
  const payHeaders = ['EFT', 'CASH', 'CARD', 'RCS', 'FLEET'];
  for (let i = 0; i < 5; i++) {
    const ph = C_(r+1, 5 + i);
    ph.value = payHeaders[i];
    fill(ph, C.lightBlue); font(ph, { bold: true, size: 8 }); align(ph, 'center', 'middle'); thinBorder(ph);
  }
  r += 2;

  // Payment TRUE/FALSE values row
  R(r).height = 16;
  // Left side blank cells for address continuation already handled; put border on left
  thinBorder(C_(r, 1));
  M(r, 2, r, 4); thinBorder(C_(r, 2));

  const payVals = [inv.payment.eft, inv.payment.cash, inv.payment.card, inv.payment.rcs, inv.payment.fleet];
  for (let i = 0; i < 5; i++) {
    const pv = C_(r, 5 + i);
    pv.value = boolLabel(payVals[i]);
    font(pv, { bold: true, size: 9, color: boolColor(payVals[i]) });
    fill(pv, C.white); align(pv, 'center', 'middle'); thinBorder(pv);
  }
  r++;

  // ─── ROW: Job Description ─────────────────────────────────────────────────
  R(r).height = 16;
  const jdLbl = C_(r, 1);
  jdLbl.value = 'Job Description';
  fill(jdLbl, C.lightBlue); font(jdLbl, { bold: true, size: 9 }); align(jdLbl, 'left', 'middle'); thinBorder(jdLbl);

  M(r, 2, r, 10);
  const jdVal = C_(r, 2);
  jdVal.value = inv.job_description;
  fill(jdVal, C.lightBlue); font(jdVal, { size: 9 }); align(jdVal, 'left', 'middle'); thinBorder(jdVal);
  r++;

  // ─── ROW: Notes ───────────────────────────────────────────────────────────
  R(r).height = 16;
  const notesLbl = C_(r, 1);
  notesLbl.value = 'Notes';
  fill(notesLbl, C.midBlue); font(notesLbl, { bold: true, size: 9 }); align(notesLbl, 'left', 'middle'); thinBorder(notesLbl);

  M(r, 2, r, 10);
  const notesVal = C_(r, 2);
  notesVal.value = inv.notes;
  fill(notesVal, C.midBlue); font(notesVal, { size: 9 }); align(notesVal, 'left', 'middle'); thinBorder(notesVal);
  r++;

  // ─── SPACER ───────────────────────────────────────────────────────────────
  R(r).height = 6; r++;

  // ─── Items table header ───────────────────────────────────────────────────
  R(r).height = 18;
  M(r, 1, r, 5);
  const descHdr = C_(r, 1);
  descHdr.value = 'DESCRIPTION';
  fill(descHdr, C.lightBlue); font(descHdr, { bold: true, size: 9 }); align(descHdr, 'center', 'middle'); thinBorder(descHdr);

  const qtyHdr = C_(r, 6);
  qtyHdr.value = 'QTY';
  fill(qtyHdr, C.lightBlue); font(qtyHdr, { bold: true, size: 9 }); align(qtyHdr, 'center', 'middle'); thinBorder(qtyHdr);

  // Blank gap column
  const gapHdr = C_(r, 7);
  fill(gapHdr, C.lightBlue); thinBorder(gapHdr);

  M(r, 8, r, 9);
  const upHdr = C_(r, 8);
  upHdr.value = 'UNIT PRICE';
  fill(upHdr, C.lightBlue); font(upHdr, { bold: true, size: 9 }); align(upHdr, 'center', 'middle'); thinBorder(upHdr);

  const npHdr = C_(r, 10);
  npHdr.value = 'NETT PRICE';
  fill(npHdr, C.lightBlue); font(npHdr, { bold: true, size: 9 }); align(npHdr, 'center', 'middle'); thinBorder(npHdr);
  r++;

  // ─── Item rows (ensure at least 20 rows) ─────────────────────────────────
  const ITEM_ROWS = 20;
  const items = inv.items.slice(0, ITEM_ROWS);
  // Pad to ITEM_ROWS
  while (items.length < ITEM_ROWS) items.push({ description: '', qty: '', unit_price: '', nett_price: '' });

  for (let i = 0; i < items.length; i++) {
    R(r).height = 15;
    const itm = items[i];
    const rowBg = i % 2 === 1 ? C.lightGrey : C.white;

    M(r, 1, r, 5);
    const dCell = C_(r, 1);
    dCell.value = itm.description;
    fill(dCell, rowBg); font(dCell, { size: 9 }); align(dCell, 'left', 'middle'); thinBorder(dCell);

    const qCell = C_(r, 6);
    qCell.value = itm.qty !== '' ? itm.qty : '';
    fill(qCell, rowBg); font(qCell, { size: 9 }); align(qCell, 'center', 'middle'); thinBorder(qCell);

    const gCell = C_(r, 7);
    fill(gCell, rowBg); thinBorder(gCell);

    M(r, 8, r, 9);
    const upCell = C_(r, 8);
    upCell.value = itm.unit_price !== '' ? rands(itm.unit_price) : '';
    fill(upCell, rowBg); font(upCell, { size: 9 }); align(upCell, 'right', 'middle'); thinBorder(upCell);

    const npCell = C_(r, 10);
    npCell.value = itm.nett_price !== '' ? rands(itm.nett_price) : '';
    fill(npCell, rowBg); font(npCell, { size: 9 }); align(npCell, 'right', 'middle'); thinBorder(npCell);
    r++;
  }

  // ─── Warning messages ─────────────────────────────────────────────────────
  const warnings = [
    '***STORAGE CHARGES WILL BE IMPLEMENTED IF THE QUOTE IS NOT ACCEPTED WITHIN 7 DAYS***',
    '***QUOTATIONS ARE SUBJECT TO STRIPPING***',
    '***PART PRICING IS SUBJECT TO AVAILABILITY AT TIME OR ORDER***',
  ];
  for (const w of warnings) {
    R(r).height = 14;
    M(r, 1, r, 10);
    const wc = C_(r, 1);
    wc.value = w;
    font(wc, { bold: true, size: 8, color: C.orange }); align(wc, 'center', 'middle'); thinBorder(wc);
    r++;
  }

  // ─── System Checks ────────────────────────────────────────────────────────
  R(r).height = 16;
  M(r, 1, r, 10);
  const scHdr = C_(r, 1);
  scHdr.value = 'System Checks Included:';
  fill(scHdr, C.lightBlue); font(scHdr, { bold: true, size: 9 }); align(scHdr, 'center', 'middle'); thinBorder(scHdr);
  r++;

  const systemChecks = [
    ['Brakes',               inv.checks.brakes,           'Oil Levels',          inv.checks.oil_levels,    'Shocks',                inv.checks.shocks],
    ['V - Belts',            inv.checks.vbelts,           'Lights',              inv.checks.lights,         'Wipers',                inv.checks.wipers],
    ['Wheel bearings',       inv.checks.wheel_bearings,   'Hand Brake',          inv.checks.hand_brake,     'Water and oil leaks',   inv.checks.water_oil_leaks],
    ['Cooling system / Hose',inv.checks.cooling,          'Tyres',               inv.checks.tyres,          '',                      null],
  ];

  for (const row of systemChecks) {
    R(r).height = 15;
    // Group 1: cols A-B = name, C = val
    M(r, 1, r, 2);
    const c1n = C_(r, 1); c1n.value = row[0]; font(c1n, { size: 9 }); thinBorder(c1n); align(c1n, 'left', 'middle');
    const c1v = C_(r, 3); c1v.value = boolLabel(row[1]); font(c1v, { size: 9, bold: true, color: boolColor(row[1]) }); thinBorder(c1v); align(c1v, 'left', 'middle');

    // Group 2: cols D-F = name, col G = val
    M(r, 4, r, 6);
    const c2n = C_(r, 4); c2n.value = row[2]; font(c2n, { size: 9 }); thinBorder(c2n); align(c2n, 'left', 'middle');
    const c2v = C_(r, 7); c2v.value = boolLabel(row[3]); font(c2v, { size: 9, bold: true, color: boolColor(row[3]) }); thinBorder(c2v); align(c2v, 'left', 'middle');

    // Group 3: cols H-I = name, col J = val
    M(r, 8, r, 9);
    const c3n = C_(r, 8); c3n.value = row[4]; font(c3n, { size: 9 }); thinBorder(c3n); align(c3n, 'left', 'middle');
    const c3v = C_(r, 10);
    if (row[5] !== null) {
      c3v.value = boolLabel(row[5]);
      font(c3v, { size: 9, bold: true, color: boolColor(row[5]) });
    }
    thinBorder(c3v); align(c3v, 'left', 'middle');
    r++;
  }

  // ─── Banking + Totals ─────────────────────────────────────────────────────
  R(r).height = 6; r++; // spacer

  const bankStart = r;
  R(r).height = 14;
  // Banking section header
  M(r, 1, r, 5);
  const bankHdr = C_(r, 1);
  bankHdr.value = 'OUR BANKING DETAILS';
  font(bankHdr, { bold: true, size: 9 }); align(bankHdr, 'left', 'middle'); thinBorder(bankHdr);

  // Totals section header – right side
  M(r, 7, r, 8);
  const totalNetLbl = C_(r, 7);
  totalNetLbl.value = 'TOTAL NETT PRICE';
  fill(totalNetLbl, C.lightBlue); font(totalNetLbl, { bold: true, size: 9 }); align(totalNetLbl, 'left', 'middle'); thinBorder(totalNetLbl);
  M(r, 9, r, 10);
  const totalNetVal = C_(r, 9);
  totalNetVal.value = rands(inv.totals.subtotal);
  font(totalNetVal, { bold: true, size: 9 }); align(totalNetVal, 'right', 'middle'); thinBorder(totalNetVal);
  r++;

  // Bank details rows
  const bankLines = [
    inv.banking.company,
    `BANK:            ${inv.banking.bank}`,
    `BRANCH CODE:     ${inv.banking.branch_code}`,
    `ACCOUNT NUMBER:  ${inv.banking.account_number}`,
    `REF NO:          ${inv.banking.ref_no}`,
  ];
  const vatLabel = `VAT 15% (${process.env.VAT_NO || '4350295624'}):`;

  for (let i = 0; i < bankLines.length; i++) {
    R(r).height = 14;
    M(r, 1, r, 5);
    const blc = C_(r, 1);
    blc.value = bankLines[i];
    font(blc, { size: 9, bold: i === 0 }); align(blc, 'left', 'middle'); thinBorder(blc);

    // VAT row (index 1) and TOTAL row (index 2)
    if (i === 1) {
      M(r, 7, r, 8);
      const vatLbl = C_(r, 7);
      vatLbl.value = vatLabel;
      fill(vatLbl, C.lightBlue); font(vatLbl, { bold: true, size: 9 }); align(vatLbl, 'left', 'middle'); thinBorder(vatLbl);
      M(r, 9, r, 10);
      const vatVal = C_(r, 9);
      vatVal.value = rands(inv.totals.vat_amount);
      font(vatVal, { bold: true, size: 9 }); align(vatVal, 'right', 'middle'); thinBorder(vatVal);
    } else if (i === 2) {
      M(r, 7, r, 8);
      const ttlLbl = C_(r, 7);
      ttlLbl.value = 'TOTAL PRICE';
      fill(ttlLbl, C.lightBlue); font(ttlLbl, { bold: true, size: 9 }); align(ttlLbl, 'left', 'middle'); thinBorder(ttlLbl);
      M(r, 9, r, 10);
      const ttlVal = C_(r, 9);
      ttlVal.value = rands(inv.totals.total);
      font(ttlVal, { bold: true, size: 10 }); align(ttlVal, 'right', 'middle'); thinBorder(ttlVal);
    } else {
      // empty right-side cells for alignment
      M(r, 7, r, 10);
      thinBorder(C_(r, 7));
    }
    r++;
  }

  // ─── Guarantee footer ─────────────────────────────────────────────────────
  R(r).height = 14;
  M(r, 1, r, 10);
  const gHdr = C_(r, 1);
  gHdr.value = 'Guarantee';
  font(gHdr, { bold: true, underline: true, size: 9 }); align(gHdr, 'left', 'middle');
  r++;

  R(r).height = 40;
  M(r, 1, r, 10);
  const gText = C_(r, 1);
  gText.value =
    'Labour has a warranty of 1 year or 10 000 km. Exclusions are as follows: Parts fitted not supplied by Bullet Auto Performance, rattles and squeaks, ' +
    'abnormal operating conditions or abuse. All Parts used are Not OEM (Original Equipment Manufacturer) unless specified by customer. All parts used is subject to supplier guarantee. ' +
    'Exclusions are as follows: Wear and Tear of items, reconditioned or exchange units, abuse or abnormal operating conditions. ' +
    'For T&Cs see www.bulletauto.co.za. Quotes are valid for 7 days after issue. SAGE: BY ACCEPTING THIS QUOTATION YOU ARE AGREEING TO OUR T\'s & C\'s.';
  font(gText, { size: 7 }); align(gText, 'left', 'top', true);

  return wb;
}

// ─── Normalise / default invoice data ────────────────────────────────────────
function normalise(inv = {}) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  return {
    quote_no:        inv.quote_no        || 'Q28-',
    date:            inv.date            || today,
    in_date:         inv.in_date         || '',
    out_date:        inv.out_date        || '',
    customer: {
      name:    inv.customer?.name    || '',
      att:     inv.customer?.att     || '',
      phone:   inv.customer?.phone   || '',
      email:   inv.customer?.email   || '',
      vat_no:  inv.customer?.vat_no  || '',
      address: inv.customer?.address || '',
    },
    vehicle: {
      make:      inv.vehicle?.make      || '',
      model:     inv.vehicle?.model     || '',
      reg_no:    inv.vehicle?.reg_no    || '',
      vin_no:    inv.vehicle?.vin_no    || '',
      engine_no: inv.vehicle?.engine_no || '',
      odometer:  inv.vehicle?.odometer  || '',
    },
    payment: {
      eft:   inv.payment?.eft   !== undefined ? !!inv.payment.eft   : true,
      cash:  inv.payment?.cash  !== undefined ? !!inv.payment.cash  : false,
      card:  inv.payment?.card  !== undefined ? !!inv.payment.card  : false,
      rcs:   inv.payment?.rcs   !== undefined ? !!inv.payment.rcs   : false,
      fleet: inv.payment?.fleet !== undefined ? !!inv.payment.fleet : false,
    },
    job_description: inv.job_description || 'Service',
    notes:           inv.notes           || '',
    items:           Array.isArray(inv.items) ? inv.items : [],
    checks: {
      brakes:           !!inv.checks?.brakes,
      vbelts:           !!inv.checks?.vbelts,
      wheel_bearings:   !!inv.checks?.wheel_bearings,
      cooling:          !!inv.checks?.cooling,
      oil_levels:       !!inv.checks?.oil_levels,
      lights:           !!inv.checks?.lights,
      hand_brake:       !!inv.checks?.hand_brake,
      tyres:            !!inv.checks?.tyres,
      shocks:           !!inv.checks?.shocks,
      wipers:           !!inv.checks?.wipers,
      water_oil_leaks:  !!inv.checks?.water_oil_leaks,
    },
    banking: {
      company:        process.env.BANK_COMPANY  || 'BULLET RAJA AGENCY (Pty) Ltd',
      bank:           process.env.BANK_NAME     || 'FNB',
      branch_code:    process.env.BANK_BRANCH   || '251945 (Cape Gate)',
      account_number: process.env.BANK_ACCOUNT  || '62831852274',
      ref_no:         inv.quote_no              || inv.banking?.ref_no || 'Q28-',
    },
    totals: {
      subtotal:   Number(inv.totals?.subtotal  || 0),
      vat_rate:   Number(inv.totals?.vat_rate  || 15),
      vat_amount: Number(inv.totals?.vat_amount || 0),
      total:      Number(inv.totals?.total     || 0),
    },
  };
}

module.exports = { generateInvoiceExcel };
