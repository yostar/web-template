import React, { useState } from 'react';
import { func, object, string, bool } from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT, STOCK_MULTIPLE_ITEMS } from '../../../../util/types';
import { displayDeliveryPickup, displayDeliveryShipping } from '../../../../util/configHelpers';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import { H3, ListingLink } from '../../../../components';
import { Info } from 'lucide-react';

// Import modules from this directory
import EditListingDeliveryForm from './EditListingDeliveryForm';
import css from './EditListingDeliveryPanel.module.css';

const { Money } = sdkTypes;

const getInitialValues = props => {
  const { listing, listingTypes, marketplaceCurrency } = props;
  const { geolocation, publicData, price } = listing?.attributes || {};

  const listingType = listing?.attributes?.publicData?.listingType;
  const listingTypeConfig = listingTypes.find(conf => conf.listingType === listingType);
  const displayShipping = displayDeliveryShipping(listingTypeConfig);
  const displayPickup = displayDeliveryPickup(listingTypeConfig);
  const displayMultipleDelivery = displayShipping && displayPickup;

  // Only render current search if full place object is available in the URL params
  // TODO bounds are missing - those need to be queried directly from Google Places
  const locationFieldsPresent = publicData?.location?.address && geolocation;
  const location = publicData?.location || {};
  const { address, building, businessName, managerName, managerPhone, managerEmail } = location;
  const {
    shippingEnabled,
    pickupEnabled,
    shippingPriceInSubunitsOneItem,
    shippingPriceInSubunitsAdditionalItems,
  } = publicData;
  const deliveryOptions = [];

  if (shippingEnabled || (!displayMultipleDelivery && displayShipping)) {
    deliveryOptions.push('shipping');
  }
  if (pickupEnabled || (!displayMultipleDelivery && displayPickup)) {
    deliveryOptions.push('pickup');
  }

  const currency = price?.currency || marketplaceCurrency;
  const shippingOneItemAsMoney =
    shippingPriceInSubunitsOneItem != null
      ? new Money(shippingPriceInSubunitsOneItem, currency)
      : null;
  const shippingAdditionalItemsAsMoney =
    shippingPriceInSubunitsAdditionalItems != null
      ? new Money(shippingPriceInSubunitsAdditionalItems, currency)
      : null;

  // Initial values for the form
  return {
    building,
    businessName,
    managerName,
    managerPhone,
    managerEmail,
    location: locationFieldsPresent
      ? {
          search: address,
          selectedPlace: { address, origin: geolocation },
        }
      : { search: undefined, selectedPlace: undefined },
    deliveryOptions,
    shippingPriceInSubunitsOneItem: shippingOneItemAsMoney,
    shippingPriceInSubunitsAdditionalItems: shippingAdditionalItemsAsMoney,
  };
};

const EditListingDeliveryPanel = props => {
  // State is needed since LocationAutocompleteInput doesn't have internal state
  // and therefore re-rendering would overwrite the values during XHR call.
  const [state, setState] = useState({ initialValues: getInitialValues(props) });

  const {
    className,
    rootClassName,
    listing,
    listingTypes,
    marketplaceCurrency,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
    categoryConfigs
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const {
    id: listingId,
    attributes: { state: listingState, price: listingPrice, publicData } = {},
  } = listing || {};
  const { listingType, categoryLevel1 } = publicData || {};

  const isPublished = listingId && listingState !== LISTING_STATE_DRAFT;
  const priceCurrencyValid = listingPrice?.currency === marketplaceCurrency;
  const listingTypeConfig = listingTypes.find(conf => conf.listingType === listingType);
  const listingCategoryConfig = categoryConfigs.find(conf => conf.id === categoryLevel1);
  const stockType = listingCategoryConfig?.stockType || listingTypeConfig?.stockType;
  const hasStockInUse = stockType === STOCK_MULTIPLE_ITEMS;

  return (
    <div className={classes}>
        <H3 as="h1">
          {isPublished ? (
            <FormattedMessage
              id="EditListingDeliveryPanel.title"
              values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
            />
          ) : (
            <FormattedMessage
              id="EditListingDeliveryPanel.createListingTitle"
              values={{ lineBreak: <br /> }}
            />
          )}
        </H3>
        
        <div className={css.locationNote}>
          <Info className={css.infoIcon} /> 
          <FormattedMessage id="EditListingDeliveryPanel.locationNote" />
        </div>

      {priceCurrencyValid ? (
        <EditListingDeliveryForm
          className={css.form}
          initialValues={state.initialValues}
          onSubmit={values => {
            const {
              building = '',
              businessName = '',
              managerName = '',
              managerPhone = '',
              managerEmail = '',
              location,
              shippingPriceInSubunitsOneItem,
              shippingPriceInSubunitsAdditionalItems,
              deliveryOptions,
            } = values;

            const shippingEnabled = deliveryOptions.includes('shipping');
            const pickupEnabled = deliveryOptions.includes('pickup');
            const address = location?.selectedPlace?.address || null;
            const origin = location?.selectedPlace?.origin || null;

            const pickupDataMaybe =
              pickupEnabled && address ? { location: { address, building, businessName, managerName, managerPhone, managerEmail } } : {};

            const shippingDataMaybe =
              shippingEnabled && shippingPriceInSubunitsOneItem != null
                ? {
                    // Note: we only save the "amount" because currency should not differ from listing's price.
                    // Money is always dealt in subunits (e.g. cents) to avoid float calculations.
                    shippingPriceInSubunitsOneItem: shippingPriceInSubunitsOneItem.amount,
                    shippingPriceInSubunitsAdditionalItems:
                      shippingPriceInSubunitsAdditionalItems?.amount,
                  }
                : {};

            // New values for listing attributes
            const updateValues = {
              geolocation: origin,
              publicData: {
                pickupEnabled,
                ...pickupDataMaybe,
                shippingEnabled,
                ...shippingDataMaybe,
              },
            };

            // Save the initialValues to state
            // LocationAutocompleteInput doesn't have internal state
            // and therefore re-rendering would overwrite the values during XHR call.
            setState({
              initialValues: {
                building,
                businessName,
                managerName,
                managerPhone,
                managerEmail,
                location: { search: address, selectedPlace: { address, origin } },
                shippingPriceInSubunitsOneItem,
                shippingPriceInSubunitsAdditionalItems,
                deliveryOptions,
              },
            });
            onSubmit(updateValues);
          }}
          listingTypeConfig={listingTypeConfig}
          listingCategoryConfig={listingCategoryConfig}
          marketplaceCurrency={marketplaceCurrency}
          hasStockInUse={hasStockInUse}
          saveActionMsg={submitButtonText}
          disabled={disabled}
          ready={ready}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          fetchErrors={errors}
          autoFocus
        />
      ) : (
        <div className={css.priceCurrencyInvalid}>
          <FormattedMessage
            id="EditListingPricingPanel.listingPriceCurrencyInvalid"
            values={{ marketplaceCurrency }}
          />
        </div>
      )}
    </div>
  );
};

EditListingDeliveryPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
};

EditListingDeliveryPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,
  marketplaceCurrency: string.isRequired,

  disabled: bool.isRequired,
  ready: bool.isRequired,
  onSubmit: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingDeliveryPanel;