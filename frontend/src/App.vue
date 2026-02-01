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
          <p class="helper">Monthly amount before housing costs (rent or mortgage).</p>
        </div>
        <div class="field">
          <label for="initial">Initial lump sum</label>
          <input id="initial" type="number" min="0" step="500" v-model.number="initialInvestment" />
          <p class="helper helper-spacer">Spacer</p>
        </div>
      </div>
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
          <p class="result-value">{{ formatCurrency(results.mortgageInvest) }}</p>
          <p class="muted">
            Includes home equity growth, invests what remains after the mortgage payment, and subtracts paid interest.
          </p>
        </div>
      </div>
    </section>

    <section class="panel projection">
      <div class="projection-header">
        <div>
          <h2>Investment growth detail</h2>
          <p class="muted">
            The schedule mirrors the Google Sheets formulas you shared, using monthly contributions after rent and median
            market returns. "Own money share" shows how much of the portfolio comes from your contributions.
          </p>
        </div>
        <div class="legend">
          <span class="legend-item">
            <span class="legend-swatch legend-total"></span>
            Total invested
          </span>
          <span class="legend-item">
            <span class="legend-swatch legend-portfolio"></span>
            Portfolio value
          </span>
        </div>
      </div>

      <div class="bar-chart" aria-hidden="true">
        <div
          v-for="row in investmentSchedule"
          :key="row.year"
          class="bar-group"
          :style="{ '--group-height': `${row.portfolioHeight}%` }"
        >
          <div
            class="bar bar-total"
            :style="{ height: `${row.totalHeight}%` }"
          ></div>
          <div
            class="bar bar-portfolio"
            :style="{ height: `${row.portfolioHeight}%` }"
          ></div>
          <span class="bar-label">{{ row.year }}</span>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Total invested</th>
              <th scope="col">Portfolio value</th>
              <th scope="col">Own money share</th>
              <th scope="col">Monthly income</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in investmentSchedule" :key="row.year">
              <th scope="row">{{ row.year }}</th>
              <td>{{ formatCurrency(row.totalInvested) }}</td>
              <td>{{ formatCurrency(row.portfolioValue) }}</td>
              <td>{{ formatPercent(row.ownMoneyShare) }}</td>
              <td>{{ formatCurrency(row.monthlyIncome) }}</td>
            </tr>
          </tbody>
        </table>
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

  const investValue = futureValue(
    monthlyInv,
    data.annualMarketReturn,
    horizonYears,
    initialInv
  );

  const rentInvestment = Math.max(monthlyInv - rentCost, 0);
  const rentValue = futureValue(
    rentInvestment,
    data.annualMarketReturn,
    horizonYears,
    initialInv
  );

  const downPayment = homePriceVal * (downPct / 100);
  const mortgagePrincipal = Math.max(homePriceVal - downPayment, 0);
  const mortgagePayment = mortgageMonthlyPayment(
    mortgagePrincipal,
    data.mortgageRate,
    termYears
  );
  const mortgageInitialInvestment = Math.max(initialInv - downPayment, 0);
  const investmentAfterMortgage = Math.max(monthlyInv - mortgagePayment, 0);
  const mortgageYearsPaid = Math.min(horizonYears, termYears);
  const remainingYears = Math.max(horizonYears - termYears, 0);
  const investmentDuringMortgage = futureValue(
    investmentAfterMortgage,
    data.annualMarketReturn,
    mortgageYearsPaid,
    mortgageInitialInvestment
  );
  const mortgageInvestmentValue =
    remainingYears > 0
      ? futureValue(
          monthlyInv,
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
  const mortgageMonthsPaid = Math.min(horizonYears, termYears) * 12;
  const totalPayments = mortgagePayment * mortgageMonthsPaid;
  const principalPaid = mortgagePrincipal - remainingBalance;
  const interestPaid = Math.max(totalPayments - principalPaid, 0);

  return {
    investOnly: investValue,
    rentInvest: rentValue,
    mortgageInvest: mortgageInvestmentValue + homeEquity - interestPaid,
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
  if (!data) {
    return [] as Array<{
      year: number;
      totalInvested: number;
      portfolioValue: number;
      ownMoneyShare: number;
      monthlyIncome: number;
      totalHeight: number;
      portfolioHeight: number;
    }>;
  }

  const monthlyInv = toNum(monthlyInvestment.value);
  const initialInv = toNum(initialInvestment.value);
  const horizonYears = Math.max(1, Math.floor(toNum(years.value, 1)));
  const rentCost = toNum(monthlyRent.value);
  const annualRate = data.annualMarketReturn;
  const netMonthlyInvestment = Math.max(monthlyInv - rentCost, 0);

  const rows = Array.from({ length: horizonYears }, (_, index) => {
    const year = index + 1;
    const totalInvested = initialInv + netMonthlyInvestment * 12 * year;
    const portfolioValue = futureValue(
      netMonthlyInvestment,
      annualRate,
      year,
      initialInv,
      true
    );
    const ownMoneyShare = portfolioValue > 0 ? totalInvested / portfolioValue : 0;
    const monthlyIncome = portfolioValue * (annualRate / 12);

    return {
      year,
      totalInvested,
      portfolioValue,
      ownMoneyShare,
      monthlyIncome,
      totalHeight: 0,
      portfolioHeight: 0,
    };
  });

  const maxValue = rows.reduce(
    (acc, row) => Math.max(acc, row.totalInvested, row.portfolioValue),
    0
  );
  return rows.map((row) => ({
    ...row,
    totalHeight: maxValue > 0 ? (row.totalInvested / maxValue) * 100 : 0,
    portfolioHeight: maxValue > 0 ? (row.portfolioValue / maxValue) * 100 : 0,
  }));
});
</script>
