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
        </div>
        <div class="field">
          <label for="monthly">Monthly investment</label>
          <input id="monthly" type="number" min="0" step="50" v-model.number="monthlyInvestment" />
          <p class="helper">Amount available for investing each month. For Rent & invest, rent is subtracted from this.</p>
        </div>
        <div class="field">
          <label for="initial">Initial lump sum</label>
          <input id="initial" type="number" min="0" step="500" v-model.number="initialInvestment" />
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
          <p class="muted">Portfolio value when you invest (monthly investment − monthly rent) each month, plus initial lump sum.</p>
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
  initial = 0
) => {
  const months = totalYears * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) {
    return initial + monthlyContribution * months;
  }
  return (
    initial * Math.pow(1 + monthlyRate, months) +
    monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  );
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
  const monthlyRentVal = toNum(monthlyRent.value);
  const horizonYears = Math.max(1, Math.floor(toNum(years.value, 1)));
  const homePriceVal = toNum(homePrice.value);
  const downPct = Math.min(100, Math.max(0, toNum(downPaymentPercent.value)));
  const termYears = Math.max(1, Math.floor(toNum(mortgageYears.value, 1)));

  const investValue = futureValue(
    monthlyInv,
    data.annualMarketReturn,
    horizonYears,
    initialInv
  );

  // Rent & invest: amount available for investing minus rent paid each month
  const rentAdjustedMonthly = Math.max(monthlyInv - monthlyRentVal, 0);
  const rentValue = futureValue(
    rentAdjustedMonthly,
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
  const mortgageInvestmentValue = futureValue(
    investmentAfterMortgage,
    data.annualMarketReturn,
    horizonYears,
    mortgageInitialInvestment
  );
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
</script>
