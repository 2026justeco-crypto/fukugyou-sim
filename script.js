const TAX_BRACKETS = [
  { limit: 1950000, rate: 0.05, deduction: 0 },
  { limit: 3300000, rate: 0.10, deduction: 97500 },
  { limit: 6950000, rate: 0.20, deduction: 427500 },
  { limit: 9000000, rate: 0.23, deduction: 636000 },
  { limit: 18000000, rate: 0.33, deduction: 1536000 },
  { limit: 40000000, rate: 0.40, deduction: 2796000 },
  { limit: Infinity, rate: 0.45, deduction: 4796000 }
];

const SOCIAL_INSURANCE_RATE = 0.15;
const BASIC_DEDUCTION = 580000;
const RECONSTRUCTION_RATE = 0.021;
const RESIDENT_TAX_RATE = 0.10;
const FILING_THRESHOLD = 200000;

function salaryIncomeDeduction(income) {
  if (income <= 1900000) return 650000;
  if (income <= 3600000) return income * 0.3 + 80000;
  if (income <= 6600000) return income * 0.2 + 440000;
  if (income <= 8500000) return income * 0.1 + 1100000;
  return 1950000;
}

function incomeTax(taxable) {
  if (taxable <= 0) return 0;
  const t = Math.floor(taxable / 1000) * 1000;
  const bracket = TAX_BRACKETS.find(function (b) { return t <= b.limit; });
  return Math.max(0, Math.floor(t * bracket.rate - bracket.deduction));
}

function simulate(salaryYen, sideYen) {
  const salaryIncome = Math.max(0, salaryYen - salaryIncomeDeduction(salaryYen));
  const deductions = salaryYen * SOCIAL_INSURANCE_RATE + BASIC_DEDUCTION;
  const baseTaxable = Math.max(0, salaryIncome - deductions);
  const sideTaxable = Math.max(0, salaryIncome + sideYen - deductions);

  const addedIncomeTax = incomeTax(sideTaxable) - incomeTax(baseTaxable);
  const reconstructionTax = Math.floor(addedIncomeTax * RECONSTRUCTION_RATE);
  const residentTax = Math.floor(sideYen * RESIDENT_TAX_RATE);
  const totalTax = addedIncomeTax + reconstructionTax + residentTax;
  const netIncome = sideYen - totalTax;
  const netRate = sideYen > 0 ? (netIncome / sideYen) * 100 : 0;

  return {
    addedIncomeTax: addedIncomeTax,
    reconstructionTax: reconstructionTax,
    residentTax: residentTax,
    totalTax: totalTax,
    netIncome: netIncome,
    netRate: netRate,
    needsFiling: sideYen > FILING_THRESHOLD
  };
}

function formatYen(value) {
  return value.toLocaleString('ja-JP') + ' 円';
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('sim-form');
    const salaryInput = document.getElementById('salary');
    const sideInput = document.getElementById('side');
    const errorBox = document.getElementById('form-error');
    const resultArea = document.getElementById('result');
    const button = document.getElementById('calc-btn');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.textContent = '';
      resultArea.classList.remove('visible');
      resultArea.hidden = true;

      const salaryMan = Number(salaryInput.value);
      const sideMan = Number(sideInput.value);

      if (!Number.isFinite(salaryMan) || !Number.isFinite(sideMan)) {
        errorBox.textContent = '数値を入力してください。';
        return;
      }
      if (salaryMan <= 0) {
        errorBox.textContent = '本業の年収は 0 より大きい値を入力してください。';
        return;
      }
      if (sideMan <= 0) {
        errorBox.textContent = '副業収入は 0 より大きい値を入力してください。';
        return;
      }

      button.disabled = true;
      button.classList.add('loading');
      button.textContent = '計算中…';

      setTimeout(function () {
        const r = simulate(salaryMan * 10000, sideMan * 10000);

        document.getElementById('r-income-tax').textContent =
          formatYen(r.addedIncomeTax + r.reconstructionTax);
        document.getElementById('r-resident-tax').textContent = formatYen(r.residentTax);
        document.getElementById('r-total-tax').textContent = formatYen(r.totalTax);
        document.getElementById('r-net').textContent = formatYen(r.netIncome);
        document.getElementById('r-rate').textContent = r.netRate.toFixed(1) + ' %';

        const filing = document.getElementById('r-filing');
        if (r.needsFiling) {
          filing.textContent = '確定申告が必要です（副業収入が年20万円を超えています）';
          filing.className = 'filing required';
        } else {
          filing.textContent = '所得税の確定申告は原則不要です（ただし住民税の申告は必要です）';
          filing.className = 'filing not-required';
        }

        resultArea.hidden = false;
        requestAnimationFrame(function () {
          resultArea.classList.add('visible');
        });

        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = '計算する';
      }, 300);
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simulate: simulate, incomeTax: incomeTax, salaryIncomeDeduction: salaryIncomeDeduction };
}
