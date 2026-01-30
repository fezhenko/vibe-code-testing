let countryData = {};
let sourceLinks = [];

const elements = {
  country: document.getElementById("country"),
  period: document.getElementById("period"),
  monthly: document.getElementById("monthly"),
  initial: document.getElementById("initial"),
  rent: document.getElementById("rent"),
  homePrice: document.getElementById("home-price"),
  downPayment: document.getElementById("down-payment"),
  mortgageYears: document.getElementById("mortgage-years"),
  investOnly: document.getElementById("invest-only"),
  rentInvest: document.getElementById("rent-invest"),
  mortgageInvest: document.getElementById("mortgage-invest"),
  marketReturn: document.getElementById("market-return"),
  homeGrowth: document.getElementById("home-growth"),
  mortgageRate: document.getElementById("mortgage-rate"),
  mortgagePayment: document.getElementById("mortgage-payment"),
  sources: document.getElementById("data-sources"),
};

const formatCurrency = (value, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const median = (values) => {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const buildCountryData = (rawData) => {
  return Object.fromEntries(
    Object.entries(rawData).map(([country, values]) => [
      country,
      {
        currency: values.currency,
        annualMarketReturn: median(values.marketReturns),
        annualHomeGrowth: median(values.homeGrowth),
        mortgageRate: median(values.mortgageRates),
      },
    ])
  );
};

const futureValue = (monthlyContribution, annualRate, years, initial = 0) => {
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) {
    return initial + monthlyContribution * months;
  }
  return (
    initial * Math.pow(1 + monthlyRate, months) +
    monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  );
};

const mortgageMonthlyPayment = (principal, annualRate, years) => {
  const months = years * 12;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) {
    return principal / months;
  }
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
};

const mortgageBalanceAfterYears = (principal, annualRate, years, elapsedYears) => {
  const months = years * 12;
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

const update = () => {
  if (!Object.keys(countryData).length) {
    return;
  }
  const country = elements.country.value;
  const data = countryData[country];
  const years = toNumber(elements.period.value);
  const monthlyInvestment = toNumber(elements.monthly.value);
  const initialInvestment = toNumber(elements.initial.value);
  const monthlyRent = toNumber(elements.rent.value);
  const homePrice = toNumber(elements.homePrice.value);
  const downPaymentPercent = toNumber(elements.downPayment.value);
  const mortgageYears = toNumber(elements.mortgageYears.value);

  const investValue = futureValue(
    monthlyInvestment,
    data.annualMarketReturn,
    years,
    initialInvestment
  );

  const downPayment = homePrice * (downPaymentPercent / 100);
  const mortgagePrincipal = Math.max(homePrice - downPayment, 0);
  const mortgagePayment = mortgageMonthlyPayment(
    mortgagePrincipal,
    data.mortgageRate,
    mortgageYears
  );
  const investmentAfterMortgage = Math.max(
    monthlyInvestment - Math.max(mortgagePayment - monthlyRent, 0),
    0
  );
  const mortgageInvestmentValue = futureValue(
    investmentAfterMortgage,
    data.annualMarketReturn,
    years,
    initialInvestment
  );
  const remainingBalance = mortgageBalanceAfterYears(
    mortgagePrincipal,
    data.mortgageRate,
    mortgageYears,
    years
  );
  const futureHomeValue = homePrice * Math.pow(1 + data.annualHomeGrowth, years);
  const homeEquity = Math.max(futureHomeValue - remainingBalance, 0);

  const rentValue = investValue;
  const mortgageInvestValue = mortgageInvestmentValue + homeEquity;

  elements.investOnly.textContent = formatCurrency(investValue, data.currency);
  elements.rentInvest.textContent = formatCurrency(rentValue, data.currency);
  elements.mortgageInvest.textContent = formatCurrency(
    mortgageInvestValue,
    data.currency
  );

  elements.marketReturn.textContent = `${(data.annualMarketReturn * 100).toFixed(
    1
  )}% annual market return`;
  elements.homeGrowth.textContent = `${(data.annualHomeGrowth * 100).toFixed(
    1
  )}% annual home growth`;
  elements.mortgageRate.textContent = `${(data.mortgageRate * 100).toFixed(
    1
  )}% mortgage rate`;
  elements.mortgagePayment.textContent = formatCurrency(
    mortgagePayment,
    data.currency
  );
};

const hydrateSources = () => {
  elements.sources.innerHTML = "";
  sourceLinks.forEach((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = source.name;
    item.appendChild(link);
    elements.sources.appendChild(item);
  });
};

const hydrateCountries = () => {
  elements.country.innerHTML = "";
  Object.keys(countryData).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === "Poland") {
      option.selected = true;
    }
    elements.country.appendChild(option);
  });
};

["change", "input"].forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    if (event.target instanceof HTMLElement && event.target.matches("input, select")) {
      update();
    }
  });
});

update();

fetch("data/market-data.json")
  .then((response) => response.json())
  .then((data) => {
    countryData = buildCountryData(data.countries);
    sourceLinks = data.sources ?? [];
    hydrateCountries();
    hydrateSources();
    update();
  });
