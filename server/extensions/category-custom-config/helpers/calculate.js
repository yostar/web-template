const { types } = require('sharetribe-flex-sdk');
const { getExchangeRate } = require('../../common/caching');
const { DEFAULT_CURRENCY } = require('../../common/config/constants/currency.constants');

const { Money } = types;

/**
 *
 * Convert to default currency
 */
const calculateFlatFeeInCurrency = async ({
  currency,
  flatFee,
  exchangeRate: prefetchedExchangeRate,
}) => {
  const exchangeRate = prefetchedExchangeRate || (await getExchangeRate());

  const currencyExchangeRate = exchangeRate[currency] || 1;
  const dailyExchangeRate = 1 / currencyExchangeRate;

  const flatFeeInExchangeCurrency = Math.round(flatFee * dailyExchangeRate);
  return flatFeeInExchangeCurrency;
};

/**
 *
 * Convert to exchangeCurrency from default
 */
const calculateFlatFeeToCurrency = async ({ currency, flatFee }) => {
  if (currency === DEFAULT_CURRENCY) {
    return flatFee;
  }

  const exchangeRate = await getExchangeRate();

  const currencyExchangeRate = exchangeRate[currency] || 1;
  return Math.round(flatFee * currencyExchangeRate);
};

/**
 *
 * Calculate flat fee base on min flat fee vs percentage * listing price
 */
async function calculateFlatFee({
  flatFeeConfig = {},
  listingPrice,
  listingCurrency,
  exchangeRate,
}) {
  const { providerMinFlatFee, providerFeePercentage } = flatFeeConfig;

  const minFlatFee =
    listingCurrency === DEFAULT_CURRENCY
      ? providerMinFlatFee
      : await calculateFlatFeeInCurrency({
          currency: listingCurrency,
          flatFee: providerMinFlatFee,
          exchangeRate,
        });

  if (!(listingPrice instanceof Money)) {
    return minFlatFee;
  }

  return Math.max(minFlatFee, Math.round(listingPrice.amount * (providerFeePercentage / 100)));
}

module.exports = { calculateFlatFee, calculateFlatFeeInCurrency, calculateFlatFeeToCurrency };
