import React, { useEffect, useState } from 'react';
import { bool, func, number, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { STOCK_INFINITE_ITEMS, STOCK_MULTIPLE_ITEMS, propTypes } from '../../../../util/types';
import { isOldTotalMismatchStockError } from '../../../../util/errors';
import * as validators from '../../../../util/validators';
import { formatMoney, unitDivisor } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';

import PriceBreakdown from './PriceBreakdown';

// Import shared components
import {
  Button,
  Form,
  FieldCurrencyInput,
  FieldCheckboxGroup,
  FieldTextInput,
} from '../../../../components';

import { DEFAULT_CURRENCY } from '../../../../extensions/common/config/constants/currency.constants';

// Import modules from this directory
import css from './EditListingPricingAndStockForm.module.css';

const { Money } = sdkTypes;
const MILLION = 1000000;

const getPriceValidators = (listingMinimumPriceSubUnits, marketplaceCurrency, intl) => {
  const priceRequiredMsgId = { id: 'EditListingPricingAndStockForm.priceRequired' };
  const priceRequiredMsg = intl.formatMessage(priceRequiredMsgId);
  const priceRequired = validators.required(priceRequiredMsg);

  const minPriceRaw = new Money(listingMinimumPriceSubUnits, marketplaceCurrency);
  const minPrice = formatMoney(intl, minPriceRaw);
  const priceTooLowMsgId = { id: 'EditListingPricingAndStockForm.priceTooLow' };
  const priceTooLowMsg = intl.formatMessage(priceTooLowMsgId, { minPrice });
  const minPriceRequired = validators.moneySubUnitAmountAtLeast(
    priceTooLowMsg,
    listingMinimumPriceSubUnits
  );

  return listingMinimumPriceSubUnits
    ? validators.composeValidators(priceRequired, minPriceRequired)
    : priceRequired;
};

/**
 * If stock type is changed to infinity (on the fly),
 * we show checkbox for providers to update their current stock to infinity.
 * This is created to avoid overselling problem, if operator changes stock type
 * from finite to infinite. I.e. the provider notices, if stock management configuration has changed.
 *
 * Note 1: infinity is faked using billiard aka 10^15
 * Note 2: If stock is less than a million (10^6) items, we show this checkbox component.
 *
 * @param {Object} props contains { hasInfiniteStock, currentStock, formId, intl }
 * @returns a component containing checkbox group (stockTypeInfinity) with one key: infinity
 */
const UpdateStockToInfinityCheckboxMaybe = ({ hasInfiniteStock, currentStock, formId, intl }) => {
  return hasInfiniteStock && currentStock != null && currentStock < MILLION ? (
    <div className={css.input}>
      <p>
        <FormattedMessage
          id="EditListingPricingAndStockForm.updateToInfiniteInfo"
          values={{
            currentStock,
            b: msgFragment => <b>{msgFragment}</b>,
          }}
        />
      </p>
      <FieldCheckboxGroup
        id={`${formId}.stockTypeInfinity`}
        name="stockTypeInfinity"
        options={[
          {
            key: 'infinity',
            label: intl.formatMessage({
              id: 'EditListingPricingAndStockForm.updateToInfinite',
            }),
          },
        ]}
        validate={validators.requiredFieldArrayCheckbox(
          intl.formatMessage({
            id: 'EditListingPricingAndStockForm.updateToInfiniteRequired',
          })
        )}
      />
    </div>
  ) : null;
};

export const EditListingPricingAndStockFormComponent = props => {
  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      subscription={{ values: true, pristine: true, submitting: true, invalid: true }}
      render={formRenderProps => {
        const {
          formId,
          autoFocus,
          className,
          disabled,
          ready,
          handleSubmit,
          intl,
          invalid,
          pristine,
          marketplaceCurrency,
          unitType,
          listingMinimumPriceSubUnits,
          saveActionMsg,
          updated,
          updateInProgress,
          fetchErrors,
          values,

          // Custom props
          providerCommission,
          providerFlatFee,
          stockType,
        } = formRenderProps;

        const currentUser = useSelector(state => state.user.currentUser);
        const userCurrency =
          currentUser?.attributes.profile.publicData.userCurrency || DEFAULT_CURRENCY;

        const priceValidators = getPriceValidators(
          listingMinimumPriceSubUnits,
          marketplaceCurrency,
          intl
        );
        // Note: outdated listings don't have listingType!
        // I.e. listings that are created with previous listing type setup.
        const hasStockManagement = stockType === STOCK_MULTIPLE_ITEMS;
        const stockValidator = validators.numberAtLeast(
          intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockIsRequired' }),
          0
        );
        const hasInfiniteStock = STOCK_INFINITE_ITEMS.includes(stockType);
        const currentStock = values.stock;

        const classes = classNames(css.root, className);
        const submitReady = (updated && pristine) || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled = invalid || disabled || submitInProgress;
        const { updateListingError, showListingsError, setStockError } = fetchErrors || {};

        const stockErrorMessage = isOldTotalMismatchStockError(setStockError)
          ? intl.formatMessage({ id: 'EditListingPricingAndStockForm.oldStockTotalWasOutOfSync' })
          : intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockUpdateFailed' });

        const priceValue =
          values.price && values.price.amount
            ? values.price.amount / unitDivisor(marketplaceCurrency)
            : 0;

        const priceBreakdownRenderMaybe = !invalid ? (
          <PriceBreakdown
            price={priceValue}
            currencyConfig={{
              currency: marketplaceCurrency,
              ...appSettings.getCurrencyFormatting(marketplaceCurrency),
            }}
            providerCommission={providerCommission}
            providerFlatFee={providerFlatFee}
          />
        ) : null;

        return (
          <Form onSubmit={handleSubmit} className={classes}>
            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingPricingAndStockForm.updateFailed" />
              </p>
            ) : null}
            {showListingsError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingPricingAndStockForm.showListingFailed" />
              </p>
            ) : null}
            <FieldCurrencyInput
              id={`${formId}.price`}
              name="price"
              className={css.input}
              autoFocus={autoFocus}
              label={intl.formatMessage(
                {
                  id: 'EditListingPricingAndStockForm.pricePerProduct',
                },
                {
                  providerCommission: providerCommission.percentage,
                }
              )}
              placeholder={intl.formatMessage({
                id: 'EditListingPricingAndStockForm.priceInputPlaceholder',
              })}
              currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
              validate={priceValidators}
            />

            {priceBreakdownRenderMaybe}

            {userCurrency !== DEFAULT_CURRENCY && (
              <p className={css.disclaimer}>
                <FormattedMessage id="EditListingPricingAndStockForm.priceDisclaimer" />
              </p>
            )}

            <UpdateStockToInfinityCheckboxMaybe
              formId={formId}
              hasInfiniteStock={hasInfiniteStock}
              currentStock={currentStock}
              intl={intl}
            />

            {hasStockManagement ? (
              <FieldTextInput
                className={css.input}
                id={`${formId}.stock`}
                name="stock"
                label={intl.formatMessage({ id: 'EditListingPricingAndStockForm.stockLabel' })}
                placeholder={intl.formatMessage({
                  id: 'EditListingPricingAndStockForm.stockPlaceholder',
                })}
                type="number"
                min={0}
                validate={stockValidator}
              />
            ) : (
              <Field id="stock" name="stock" type="hidden" className={css.unitTypeHidden}>
                {fieldRenderProps => <input {...fieldRenderProps?.input} />}
              </Field>
            )}
            {setStockError ? <p className={css.error}>{stockErrorMessage}</p> : null}

            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={submitReady}
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

EditListingPricingAndStockFormComponent.defaultProps = {
  fetchErrors: null,
  listingMinimumPriceSubUnits: 0,
  formId: 'EditListingPricingAndStockForm',
};

EditListingPricingAndStockFormComponent.propTypes = {
  formId: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  marketplaceCurrency: string.isRequired,
  listingMinimumPriceSubUnits: number,
  unitType: string.isRequired,
  listingType: shape({ stockType: string }).isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
};

export default compose(injectIntl)(EditListingPricingAndStockFormComponent);
