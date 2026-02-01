<template>
  <main class="app">
    <header class="header">
      <p class="eyebrow">Minimal investment planner</p>
      <h1>Median-based investment outlook</h1>
      <p class="subtitle">
        Estimate long-term value using median historical returns for European markets. Designed with Poland first, with
        support for other countries.
      </p>
    </header>

    <section class="panel">
      <div class="field">
        <label for="country">Country</label>
        <select id="country" v-model="selectedCountry">
          <option v-for="country in countryOptions" :key="country" :value="country">
            {{ country }}
          </option>
        </select>
        <p class="helper">Rates auto-update to the country median assumptions.</p>
      </div>
      <div class="grid">
        <div class="field">
          <label for="period">Period</label>
          <select id="period" v-model.number="years">
            <option :value="5">5 years</option>
            <option :value="10">10 years</option>
            <option :value="15">15 years</option>
            <option :value="20">20 years</option>
            <option :value="25">20+ years (25)</option>
          </select>
          <p class="helper helper-spacer">Spacer</p>
        </div>
        <div class="field">
          <label for="monthly">Monthly cash available</label>
          <input id="monthly" type="number" min="0" step="50" v-model.number="monthlyInvestment" />
          <p class="helper" hidden>Monthly amount before housing costs (rent or mortgage).</p>
        </div>
        <div class="field">
          <label for="initial">Initial lump sum</label>
          <input id="initial" type="number" min="0" step="500" v-model.number="initialInvestment" />
          <p class="helper helper-spacer">Spacer</p>
        </div>
      </div>
    </section>

    <section class="panel housing">
      <h2>Housing assumptions</h2>
      <div class="grid">
        <div class="field">
          <label for="rent">Monthly rent</label>
          <input id="rent" type="number" min="0" step="50" v-model.number="monthlyRent" />
        </div>
        <div class="field">
          <label for="home-price">Home price</label>
          <input id="home-price" type="number" min="0" step="5000" v-model.number="homePrice" />
        </div>
        <div class="field">
          <label for="down-payment">Down payment (%)</label>
          <input id="down-payment" type="number" min="0" max="100" step="1" v-model.number="downPaymentPercent" />
        </div>
        <div class="field">
          <label for="mortgage-years">Mortgage term (years)</label>
          <input id="mortgage-years" type="number" min="5" max="40" step="1" v-model.number="mortgageYears" />
        </div>
      </div>
      <div class="assumptions">
        <div>
          <p class="label">Median market return</p>
          <p>{{ formatPercent(assumptionsForCountry?.annualMarketReturn) }}</p>
        </div>
        <div>
          <p class="label">Median home price growth</p>
          <p>{{ formatPercent(assumptionsForCountry?.annualHomeGrowth) }}</p>
        </div>
        <div>
          <p class="label">Median mortgage rate</p>
          <p>{{ formatPercent(assumptionsForCountry?.mortgageRate) }}</p>
        </div>
        <div>
          <p class="label">Estimated mortgage payment</p>
          <p>{{ formatCurrency(results.mortgagePayment) }}</p>
        </div>
      </div>
      <p class="disclaimer">
        The calculator uses median assumptions derived from open-source datasets for guidance only. Always confirm with
        real market data and professional advice.
      </p>
    </section>

    <section class="panel">
      <h2>Results</h2>
      <div class="results">
        <div class="result-card">
          <h3>Invest-only outlook</h3>
          <p class="result-value">{{ formatCurrency(results.investOnly) }}</p>
          <p class="muted">Estimated portfolio value using median annual market returns.</p>
        </div>
        <div class="result-card">
          <h3>Rent &amp; invest</h3>
          <p class="result-value">{{ formatCurrency(results.rentInvest) }}</p>
          <p class="muted">Portfolio value when you invest the monthly amount each month, plus initial lump sum.</p>
        </div>
        <div class="result-card">
          <h3>Mortgage &amp; invest</h3>
          <p v-if="results.mortgageInvest < 0" class="result-value" style="color: var(--error); font-size: 1rem;">
            Insufficient initial capital
          </p>
          <p v-else class="result-value">{{ formatCurrency(results.mortgageInvest) }}</p>
          <p class="muted">
            Includes home equity, subtracts mortgage &amp; est. 1% maintenance.
          </p>
        </div>
      </div>
    </section>

    <section class="panel projection">
      <div class="projection-header">
        <div>
          <h2>Net Worth Comparison</h2>
          <p class="muted">
            Projected total value (Assets - Debts) for both strategies over time.
          </p>
        </div>
        <div class="legend">
      <span class="legend-item">
        <span class="legend-swatch" style="background: var(--accent)"></span>
        Rent Strategy
      </span>
          <span class="legend-item">
        <span class="legend-swatch" style="background: #f28c3d"></span>
        Buy Strategy
      </span>
        </div>
      </div>

      <div class="bar-chart" aria-hidden="true" style="margin-bottom: 2rem;">
        <div
            v-for="row in investmentSchedule"
            :key="row.year"
            class="bar-group"
        >
          <div
              class="bar bar-rent"
              :style="{ height: `${row.rentHeight}%` }"
              title="Rent Strategy"
          ></div>

          <div class="bar-stack" style="width: 12px; display: flex; flex-direction: column-reverse; height: 100%;">

            <div
                class="bar"
                style="background: #f28c3d; width: 100%; border-radius: 2px 2px 4px 4px;"
                :style="{ height: `${(row.buyHomeEquity / row.maxValue) * 100}%` }"
                title="Home Equity"
            ></div>

            <div
                class="bar"
                style="background: #4caf50; width: 100%; border-radius: 4px 4px 2px 2px;"
                :style="{ height: `${(row.buyStockPortfolio / row.maxValue) * 100}%` }"
                title="Liquid Stocks"
            ></div>
          </div>

          <span class="bar-label" v-if="row.year % 5 === 0">{{ row.year }}</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Rent Net Worth</th>
            <th scope="col">Buy Net Worth</th>
            <th scope="col">Difference</th>
            <th scope="col" class="muted">Liquid Assets (Buy)</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="row in investmentSchedule" :key="row.year">
            <th scope="row">{{ row.year }}</th>

            <td>{{ formatCurrency(row.rentPortfolio) }}</td>

            <td>{{ formatCurrency(row.buyNetWorth) }}</td>

            <td :style="{ color: row.buyNetWorth >= row.rentPortfolio ? '#2e7d32' : '#b3261e' }">
              {{ row.buyNetWorth >= row.rentPortfolio ? '+' : '' }}
              {{ formatCurrency(row.buyNetWorth - row.rentPortfolio) }}
            </td>

            <td class="muted">{{ formatCurrency(row.buyStockPortfolio) }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel sources">
      <h2>Open data sources</h2>
      <ul class="source-list">
        <li v-for="source in sources" :key="source.url">
          <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.name }}</a>
        </li>
      </ul>
    </section>

    <section v-if="error" class="panel error">
      <p>{{ error }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type SourceLink = {
  name: string;
  url: string;
};

type MedianAssumptions = {
  currency: string;
  annualMarketReturn: number;
  annualHomeGrowth: number;
  mortgageRate: number;
};

type AssumptionsResponse = {
  generatedAt: string;
  sources: SourceLink[];
  countries: Record<string, MedianAssumptions>;
};

const assumptions = ref<AssumptionsResponse | null>(null);
const error = ref<string | null>(null);

const selectedCountry = ref("Poland");
const years = ref(10);
const monthlyInvestment = ref(1000);
const initialInvestment = ref(10000);
const monthlyRent = ref(900);
const homePrice = ref(200000);
const downPaymentPercent = ref(20);
const mortgageYears = ref(25);

const countryOptions = computed(() => Object.keys(assumptions.value?.countries ?? {}));

const assumptionsForCountry = computed(() =>
  assumptions.value?.countries[selectedCountry.value]
);

const sources = computed(() => assumptions.value?.sources ?? []);

const formatCurrency = (value: number | undefined) => {
  const currency = assumptionsForCountry.value?.currency ?? "EUR";
  const safeValue = Number.isFinite(value) ? (value as number) : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(safeValue);
};

const formatPercent = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `${((value as number) * 100).toFixed(1)}%`;
};

/** Coerce to a finite number; use 0 for NaN/undefined/negative where non-negative is expected. */
const toNum = (value: unknown, min = 0): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, n);
};

const futureValue = (
  monthlyContribution: number,
  annualRate: number,
  totalYears: number,
  initial = 0,
  payAtStart = false
) => {
  const months = totalYears * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) {
    return initial + monthlyContribution * months;
  }
  const growth = Math.pow(1 + monthlyRate, months);
  const annuityFactor = (growth - 1) / monthlyRate;
  const paymentFactor = payAtStart ? annuityFactor * (1 + monthlyRate) : annuityFactor;
  return initial * growth + monthlyContribution * paymentFactor;
};

const mortgageMonthlyPayment = (principal: number, annualRate: number, termYears: number) => {
  const months = termYears * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) {
    return principal / months;
  }
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
};

const mortgageBalanceAfterYears = (
  principal: number,
  annualRate: number,
  termYears: number,
  elapsedYears: number
) => {
  const months = termYears * 12;
  const monthlyRate = annualRate / 12;
  const elapsedMonths = Math.min(elapsedYears * 12, months);
  if (monthlyRate === 0) {
    return principal - (principal / months) * elapsedMonths;
  }
  const factor = Math.pow(1 + monthlyRate, months);
  const payment = (principal * monthlyRate * factor) / (factor - 1);
  const balance =
    principal * Math.pow(1 + monthlyRate, elapsedMonths) -
    payment * ((Math.pow(1 + monthlyRate, elapsedMonths) - 1) / monthlyRate);
  return Math.max(balance, 0);
};

const results = computed(() => {
  const data = assumptionsForCountry.value;
  if (!data) {
    return { investOnly: 0, rentInvest: 0, mortgageInvest: 0, mortgagePayment: 0 };
  }

  const monthlyInv = toNum(monthlyInvestment.value);
  const initialInv = toNum(initialInvestment.value);
  const horizonYears = Math.max(1, Math.floor(toNum(years.value, 1)));
  const rentCost = toNum(monthlyRent.value);
  const homePriceVal = toNum(homePrice.value);
  const downPct = Math.min(100, Math.max(0, toNum(downPaymentPercent.value)));
  const termYears = Math.max(1, Math.floor(toNum(mortgageYears.value, 1)));

  // --- 1. RENT & INVEST SCENARIO ---
  const rentInvestment = Math.max(monthlyInv - rentCost, 0);
  const rentValue = futureValue(
      rentInvestment,
      data.annualMarketReturn,
      horizonYears,
      initialInv
  );

  // --- 2. INVEST ONLY (No housing costs logic) ---
  const investValue = futureValue(
      monthlyInv,
      data.annualMarketReturn,
      horizonYears,
      initialInv
  );

  // --- 3. MORTGAGE & INVEST SCENARIO ---
  const downPayment = homePriceVal * (downPct / 100);

  // If you don't have enough cash for the down payment, the comparison is invalid.
  // We return 0 (or a very low number) to indicate this path is impossible.
  if (downPayment > initialInv) {
    return {
      investOnly: investValue,
      rentInvest: rentValue,
      mortgageInvest: -1,
      mortgagePayment: 0
    };
  }

  const mortgagePrincipal = Math.max(homePriceVal - downPayment, 0);
  const mortgagePayment = mortgageMonthlyPayment(
      mortgagePrincipal,
      data.mortgageRate,
      termYears
  );

  // Rule of thumb: 1% of home value annually for maintenance/insurance
  const monthlyMaintenance = (homePriceVal * 0.01) / 12;

  // Investable cash is Income - Mortgage - Maintenance
  const totalHousingCost = mortgagePayment + monthlyMaintenance;

  // If mortgage + maintenance > income, you are losing money every month.
  // We treat this as negative investment (debt) or zero.
  // For simplicity here, we floor at 0, but strictly this is an impossible scenario too.
  const investmentAfterHousing = Math.max(monthlyInv - totalHousingCost, 0);

  const mortgageInitialInvestment = Math.max(initialInv - downPayment, 0);

  const mortgageYearsPaid = Math.min(horizonYears, termYears);
  const remainingYears = Math.max(horizonYears - termYears, 0);

  // Phase 1: During Mortgage
  const investmentDuringMortgage = futureValue(
      investmentAfterHousing,
      data.annualMarketReturn,
      mortgageYearsPaid,
      mortgageInitialInvestment
  );

  // Phase 2: After Mortgage (Mortgage payment drops to 0, but Maintenance remains)
  // Income - Maintenance (No mortgage)
  const monthlyInvPostMortgage = Math.max(monthlyInv - monthlyMaintenance, 0);

  const mortgageInvestmentValue =
      remainingYears > 0
          ? futureValue(
              monthlyInvPostMortgage,
              data.annualMarketReturn,
              remainingYears,
              investmentDuringMortgage
          )
          : investmentDuringMortgage;

  const remainingBalance = mortgageBalanceAfterYears(
      mortgagePrincipal,
      data.mortgageRate,
      termYears,
      horizonYears
  );
  const futureHomeValue = homePriceVal * Math.pow(1 + data.annualHomeGrowth, horizonYears);
  const homeEquity = Math.max(futureHomeValue - remainingBalance, 0);

  return {
    investOnly: investValue,
    rentInvest: rentValue,
    mortgageInvest: mortgageInvestmentValue + homeEquity,
    mortgagePayment,
  };
});

onMounted(async () => {
  try {
    const response = await fetch("/api/assumptions");
    if (!response.ok) {
      throw new Error("Unable to load market assumptions.");
    }
    const data = (await response.json()) as AssumptionsResponse;
    assumptions.value = data;
    if (!data.countries[selectedCountry.value]) {
      selectedCountry.value = Object.keys(data.countries)[0] ?? "Poland";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unexpected error loading data.";
  }
});

const investmentSchedule = computed(() => {
  const data = assumptionsForCountry.value;
  if (!data) return [];

  const monthlyInv = toNum(monthlyInvestment.value);
  const initialInv = toNum(initialInvestment.value);
  const rentCost = toNum(monthlyRent.value);
  const annualRate = data.annualMarketReturn;
  const horizonYears = Math.max(1, Math.floor(toNum(years.value, 1)));

  // Buy Scenario Inputs
  const homePriceVal = toNum(homePrice.value);
  const downPct = Math.min(100, Math.max(0, toNum(downPaymentPercent.value)));
  const downPayment = homePriceVal * (downPct / 100);
  const mortgagePrincipal = Math.max(homePriceVal - downPayment, 0);
  const termYears = Math.max(1, Math.floor(toNum(mortgageYears.value, 1)));
  const mortgagePayment = mortgageMonthlyPayment(mortgagePrincipal, data.mortgageRate, termYears);
  const monthlyMaintenance = (homePriceVal * 0.01) / 12;

  // Rent Inputs
  const rentMonthlyInvest = Math.max(monthlyInv - rentCost, 0);

  // Buy Inputs
  const buyInitialStockInvest = Math.max(initialInv - downPayment, 0);
  const buyMonthlyStockInvest = Math.max(monthlyInv - (mortgagePayment + monthlyMaintenance), 0);

  const rows = Array.from({ length: horizonYears }, (_, index) => {
    const year = index + 1;

    // 1. Rent Calculation
    const rentPortfolio = futureValue(rentMonthlyInvest, annualRate, year, initialInv, true);

    // 2. Buy Calculation
    const mortgageActiveYears = Math.min(year, termYears);
    const mortgageFreeYears = Math.max(year - termYears, 0);

    let buyStockPortfolio = futureValue(
        buyMonthlyStockInvest,
        annualRate,
        mortgageActiveYears,
        buyInitialStockInvest,
        true
    );

    if (mortgageFreeYears > 0) {
      const postMortgageMonthly = Math.max(monthlyInv - monthlyMaintenance, 0);
      buyStockPortfolio = futureValue(
          postMortgageMonthly,
          annualRate,
          mortgageFreeYears,
          buyStockPortfolio,
          true
      );
    }

    const balance = mortgageBalanceAfterYears(mortgagePrincipal, data.mortgageRate, termYears, year);
    const homeVal = homePriceVal * Math.pow(1 + data.annualHomeGrowth, year);
    const homeEquity = Math.max(homeVal - balance, 0);
    const buyNetWorth = buyStockPortfolio + homeEquity;

    return {
      year,
      rentPortfolio,
      buyNetWorth,
      buyStockPortfolio,
      buyHomeEquity: homeEquity, // <--- THIS WAS MISSING
      maxValue: Math.max(rentPortfolio, buyNetWorth)
    };
  });

  const globalMax = rows.reduce((acc, row) => Math.max(acc, row.maxValue), 0);

  return rows.map(row => ({
    ...row,
    rentHeight: globalMax > 0 ? (row.rentPortfolio / globalMax) * 100 : 0,
    buyHeight: globalMax > 0 ? (row.buyNetWorth / globalMax) * 100 : 0
  }));
});
</script>
