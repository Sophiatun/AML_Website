/*
 * Tax Estimator calculation engine.
 * All figures below are public 2025 federal tax parameters (IRS Rev. Proc.
 * 2024-40, SSA wage base announcements, and statutory NIIT/Additional
 * Medicare thresholds). State rates are rough single-rate approximations
 * the user can override — see the "State" dropdown.
 * This is a simplified, directional estimator. It is not tax advice.
 */

const FEDERAL_BRACKETS_2025 = {
  single: [
    [0.1, 11925],
    [0.12, 48475],
    [0.22, 103350],
    [0.24, 197300],
    [0.32, 250525],
    [0.35, 626350],
    [0.37, Infinity],
  ],
  mfj: [
    [0.1, 23850],
    [0.12, 96950],
    [0.22, 206700],
    [0.24, 394600],
    [0.32, 501050],
    [0.35, 751600],
    [0.37, Infinity],
  ],
  mfs: [
    [0.1, 11925],
    [0.12, 48475],
    [0.22, 103350],
    [0.24, 197300],
    [0.32, 250525],
    [0.35, 375800],
    [0.37, Infinity],
  ],
  hoh: [
    [0.1, 17000],
    [0.12, 64850],
    [0.22, 103350],
    [0.24, 197300],
    [0.32, 250500],
    [0.35, 626350],
    [0.37, Infinity],
  ],
};

const LTCG_BRACKETS_2025 = {
  single: [
    [0, 48350],
    [0.15, 533400],
    [0.2, Infinity],
  ],
  mfj: [
    [0, 96700],
    [0.15, 600050],
    [0.2, Infinity],
  ],
  // MFS long-term capital gains breakpoints follow the standard IRS
  // convention of half the MFJ thresholds (0% matches Single's, which is
  // also half of MFJ's, by construction).
  mfs: [
    [0, 48350],
    [0.15, 300025],
    [0.2, Infinity],
  ],
  hoh: [
    [0, 64750],
    [0.15, 566700],
    [0.2, Infinity],
  ],
};

const STANDARD_DEDUCTION_2025 = {
  single: 15000,
  mfj: 30000,
  mfs: 15000,
  hoh: 22500,
};

const SS_WAGE_BASE_2025 = 176100;
const SS_RATE = 0.062;
const MEDICARE_RATE = 0.0145;
const ADDL_MEDICARE_RATE = 0.009;
const ADDL_MEDICARE_THRESHOLD = {
  single: 200000,
  mfj: 250000,
  mfs: 125000,
  hoh: 200000,
};
const SE_RATE_SS = 0.124;
const SE_RATE_MEDICARE = 0.029;
const SE_NET_EARNINGS_FACTOR = 0.9235;
const NIIT_RATE = 0.038;
const NIIT_THRESHOLD = {
  single: 200000,
  mfj: 250000,
  mfs: 125000,
  hoh: 200000,
};
const DEPENDENT_CREDIT_ESTIMATE = 500;

// Rough, editable single-rate approximations of each state's top/typical
// income tax rate. Many states are progressive, have local add-ons, or tax
// capital gains differently — this is a starting point, not a filing figure.
const STATE_RATES = {
  AL: 5.0, AK: 0, AZ: 2.5, AR: 3.9, CA: 13.3, CO: 4.4, CT: 6.99, DE: 6.6,
  FL: 0, GA: 5.39, HI: 11.0, ID: 5.8, IL: 4.95, IN: 3.05, IA: 3.8, KS: 5.7,
  KY: 4.0, LA: 4.25, ME: 7.15, MD: 5.75, MA: 5.0, MI: 4.25, MN: 9.85,
  MS: 4.7, MO: 4.7, MT: 5.9, NE: 5.84, NV: 0, NH: 0, NJ: 10.75, NM: 5.9,
  NY: 10.9, NC: 4.25, ND: 2.5, OH: 3.5, OK: 4.75, OR: 9.9, PA: 3.07,
  RI: 5.99, SC: 6.2, SD: 0, TN: 0, TX: 0, UT: 4.55, VT: 8.75, VA: 5.75,
  WA: 0, WV: 4.82, WI: 7.65, WY: 0, DC: 10.75,
};

const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", DC: "Washington, DC",
};

function calcFederalTax(taxableIncome, brackets) {
  let tax = 0;
  let previousCeiling = 0;
  for (const [rate, ceiling] of brackets) {
    if (taxableIncome <= previousCeiling) break;
    const amountInBracket = Math.min(taxableIncome, ceiling) - previousCeiling;
    tax += amountInBracket * rate;
    previousCeiling = ceiling;
  }
  return tax;
}

function marginalRate(taxableIncome, brackets) {
  for (const [rate, ceiling] of brackets) {
    if (taxableIncome <= ceiling) return rate;
  }
  return brackets[brackets.length - 1][0];
}

// LTCG stacks on top of ordinary taxable income.
function calcLTCGTax(ordinaryTaxableIncome, ltcgAmount, brackets) {
  let tax = 0;
  let position = ordinaryTaxableIncome;
  let remaining = ltcgAmount;
  for (const [rate, ceiling] of brackets) {
    if (remaining <= 0) break;
    if (position >= ceiling) continue;
    const roomInBracket = ceiling - position;
    const amount = Math.min(remaining, roomInBracket);
    tax += amount * rate;
    position += amount;
    remaining -= amount;
  }
  return tax;
}

function calcPayrollTax(w2Wages, filingStatus) {
  const ss = Math.min(w2Wages, SS_WAGE_BASE_2025) * SS_RATE;
  const medicare = w2Wages * MEDICARE_RATE;
  const threshold = ADDL_MEDICARE_THRESHOLD[filingStatus];
  const addlMedicare = Math.max(0, w2Wages - threshold) * ADDL_MEDICARE_RATE;
  return ss + medicare + addlMedicare;
}

function calcSETax(seNetIncome, w2Wages, filingStatus) {
  if (seNetIncome <= 0) return 0;
  const seBase = seNetIncome * SE_NET_EARNINGS_FACTOR;
  const remainingSSRoom = Math.max(
    0,
    SS_WAGE_BASE_2025 - Math.min(w2Wages, SS_WAGE_BASE_2025),
  );
  const ssPortion = Math.min(seBase, remainingSSRoom) * SE_RATE_SS;
  const medicarePortion = seBase * SE_RATE_MEDICARE;
  const threshold = ADDL_MEDICARE_THRESHOLD[filingStatus];
  const combinedEarnings = w2Wages + seBase;
  const addlMedicareBase = Math.max(
    0,
    Math.min(seBase, combinedEarnings - threshold),
  );
  const addlMedicare = addlMedicareBase * ADDL_MEDICARE_RATE;
  return ssPortion + medicarePortion + addlMedicare;
}

function calcNIIT(magi, netInvestmentIncome, filingStatus, enabled) {
  if (!enabled) return 0;
  const threshold = NIIT_THRESHOLD[filingStatus];
  const excessMAGI = Math.max(0, magi - threshold);
  return Math.min(Math.max(0, netInvestmentIncome), excessMAGI) * NIIT_RATE;
}

function formatCurrency(amount) {
  return Math.round(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const estimatorForm = document.getElementById("estimatorForm");
const stateSelect = document.getElementById("est-state");
const stateRateInput = document.getElementById("est-state-rate");

if (stateSelect && stateRateInput) {
  Object.keys(STATE_RATES)
    .sort()
    .forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = STATE_NAMES[code] || code;
      stateSelect.appendChild(opt);
    });
  stateSelect.addEventListener("change", () => {
    const rate = STATE_RATES[stateSelect.value];
    if (rate !== undefined) stateRateInput.value = rate.toFixed(2);
  });
}

function runEstimate() {
    const fd = new FormData(estimatorForm);
    const filingStatus = fd.get("filingStatus");
    const w2Wages = parseFloat(fd.get("w2Wages")) || 0;
    const seNet = parseFloat(fd.get("seNet")) || 0;
    const k1Income = parseFloat(fd.get("k1Income")) || 0;
    const ltcg = parseFloat(fd.get("ltcg")) || 0;
    const otherIncome = parseFloat(fd.get("otherIncome")) || 0;
    const dependents = parseInt(fd.get("dependents"), 10) || 0;
    const deductionMethod = fd.get("deductionMethod");
    const itemizedAmount = parseFloat(fd.get("itemizedAmount")) || 0;
    const stateRatePct = parseFloat(fd.get("stateRate")) || 0;
    const niitEnabled = fd.get("niitEnabled") === "on";

    const ordinaryIncome = w2Wages + seNet + k1Income + otherIncome;
    const totalGrossIncome = ordinaryIncome + ltcg;

    const deduction =
      deductionMethod === "itemized"
        ? itemizedAmount
        : STANDARD_DEDUCTION_2025[filingStatus];

    const totalTaxableIncome = Math.max(0, totalGrossIncome - deduction);
    const ltcgTaxable = Math.min(ltcg, totalTaxableIncome);
    const ordinaryTaxable = Math.max(0, totalTaxableIncome - ltcgTaxable);

    const brackets = FEDERAL_BRACKETS_2025[filingStatus];
    const ltcgBrackets = LTCG_BRACKETS_2025[filingStatus];

    const ordinaryTax = calcFederalTax(ordinaryTaxable, brackets);
    const ltcgTax = calcLTCGTax(ordinaryTaxable, ltcgTaxable, ltcgBrackets);
    const federalIncomeTax = ordinaryTax + ltcgTax;

    const payrollTax = calcPayrollTax(w2Wages, filingStatus);
    const seTax = calcSETax(seNet, w2Wages, filingStatus);

    const magi = totalGrossIncome;
    const netInvestmentIncome = ltcg + otherIncome;
    const niit = calcNIIT(magi, netInvestmentIncome, filingStatus, niitEnabled);

    const stateTax = totalGrossIncome * (stateRatePct / 100);
    const dependentCredit = dependents * DEPENDENT_CREDIT_ESTIMATE;

    const totalTaxes = Math.max(
      0,
      federalIncomeTax +
        payrollTax +
        seTax +
        niit +
        stateTax -
        dependentCredit,
    );
    const effectiveRate =
      totalGrossIncome > 0 ? totalTaxes / totalGrossIncome : 0;
    const afterTaxIncome = totalGrossIncome - totalTaxes;
    const marginal = marginalRate(ordinaryTaxable, brackets);

    document.getElementById("resTotal").textContent =
      formatCurrency(totalTaxes);
    document.getElementById("resEffective").textContent =
      (effectiveRate * 100).toFixed(1) + "%";
    document.getElementById("resMarginal").textContent =
      (marginal * 100).toFixed(0) + "%";
    document.getElementById("resFederal").textContent =
      formatCurrency(federalIncomeTax);
    document.getElementById("resPayroll").textContent =
      formatCurrency(payrollTax);
    document.getElementById("resSE").textContent = formatCurrency(seTax);
    document.getElementById("resNiit").textContent = formatCurrency(niit);
    document.getElementById("resState").textContent =
      formatCurrency(stateTax);
    document.getElementById("resCredit").textContent =
      "-" + formatCurrency(dependentCredit);
    document.getElementById("resAfterTax").textContent =
      formatCurrency(afterTaxIncome);
}

if (estimatorForm) {
  estimatorForm.addEventListener("submit", (e) => e.preventDefault());
  estimatorForm.addEventListener("input", runEstimate);
  estimatorForm.addEventListener("change", runEstimate);
  runEstimate();
}

const itemizedToggle = document.getElementById("est-deduction-method");
const itemizedRow = document.getElementById("itemizedAmountRow");
if (itemizedToggle && itemizedRow) {
  itemizedToggle.addEventListener("change", () => {
    itemizedRow.style.display =
      itemizedToggle.value === "itemized" ? "flex" : "none";
  });
}
