/**
 * shared/utils/parseLicense.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure-JS parser for South African license disk barcodes / QR codes.
 * Works identically in React (web), React Native (mobile), and Node.js.
 *
 * Supported formats
 *  1. eNaTIS pipe-delimited  |version|reg|vin|engine|make|model|colour|year|expiry|owner|
 *  2. JSON  { registration, vin, make, model, … }
 *  3. Key-value pairs  "Registration: CA 123-456\nVIN: …"
 *  4. Plain registration number  "CA 123-456"
 */

'use strict';

/**
 * @param {string} raw  Raw string from barcode / QR detector
 * @returns {{
 *   registration: string, vin_no: string, engine_no: string,
 *   make: string, model: string, colour: string, year: string,
 *   owner_name: string, license_expiry: string, raw_data: string
 * }}
 */
function parseLicenseDisk(raw) {
  const empty = {
    registration: '', vin_no: '', engine_no: '',
    make: '', model: '', colour: '', year: '',
    owner_name: '', license_expiry: '',
    raw_data: raw || '',
  };

  if (!raw || !raw.trim()) return empty;
  const text = raw.trim();

  // ── 1. eNaTIS pipe-delimited format ──────────────────────────────────────
  // Example: |1|CA123456|WBAFE510X0CY12345|N47D20A1234|BMW|3 SERIES|WHITE|2011|2024/03/31|J SMITH|8001015009087|
  if (text.includes('|')) {
    const parts = text.split('|').map(p => p.trim()).filter(Boolean);
    // First field may be a version number — skip it
    let i = /^\d{1,2}$/.test(parts[0]) ? 1 : 0;
    const get = (offset) => parts[i + offset] || '';
    return {
      ...empty,
      registration:   get(0),
      vin_no:         get(1),
      engine_no:      get(2),
      make:           get(3),
      model:          get(4),
      colour:         get(5),
      year:           get(6),
      license_expiry: get(7),
      owner_name:     get(8),
    };
  }

  // ── 2. JSON format ────────────────────────────────────────────────────────
  try {
    const j = JSON.parse(text);
    return {
      ...empty,
      registration:   j.registration || j.reg_no  || j.regNo        || '',
      vin_no:         j.vin          || j.vin_no  || j.vinNo         || '',
      engine_no:      j.engine       || j.engine_no || j.engineNo    || '',
      make:           j.make         || '',
      model:          j.model        || '',
      colour:         j.colour       || j.color    || '',
      year:           String(j.year  || j.model_year || ''),
      owner_name:     j.owner        || j.owner_name || j.name       || '',
      license_expiry: j.expiry       || j.license_expiry             || '',
    };
  } catch { /* not JSON */ }

  // ── 3. Key-value pairs ────────────────────────────────────────────────────
  const extract = (...patterns) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m?.[1]) return m[1].trim();
    }
    return '';
  };

  const result = {
    ...empty,
    registration:   extract(/reg(?:istration)?[\s:=]+([A-Z0-9 /-]{3,15})/i),
    vin_no:         extract(/\bvin[\s:=]+([A-Z0-9]{10,20})/i),
    engine_no:      extract(/engine[\s:=]+([A-Z0-9]{5,20})/i),
    make:           extract(/\bmake[\s:=]+([A-Za-z ]{2,20})/i),
    model:          extract(/\bmodel[\s:=]+([A-Za-z0-9 ]{2,25})/i),
    colour:         extract(/colou?r[\s:=]+([A-Za-z ]{2,15})/i),
    year:           extract(/\byear[\s:=]+(\d{4})/i, /(?<!\d)(\d{4})(?!\d)/),
    owner_name:     extract(/owner[\s:=]+([A-Za-z ,]{2,40})/i, /\bname[\s:=]+([A-Za-z ,]{2,40})/i),
    license_expiry: extract(/expir(?:y|e|es)[\s:=]+([\d/.\-]+)/i, /valid[\s:=]+([\d/.\-]+)/i),
  };

  // ── 4. Plain registration number fallback ─────────────────────────────────
  if (!result.registration) {
    const regM = text.match(/^([A-Z]{1,3}\s?\d{2,6}\s?[A-Z0-9]{0,3})$/i);
    if (regM) result.registration = regM[1].toUpperCase().trim();
  }

  return result;
}

module.exports = { parseLicenseDisk };
