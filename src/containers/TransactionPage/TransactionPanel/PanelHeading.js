import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { createSlug, stringify } from '../../../util/urlHelpers';

import { H1, H2, NamedLink } from '../../../components';
import { formatMoney } from '../../../util/currency';

import css from './TransactionPanel.module.css';

const createListingLink = (listingId, label, listingDeleted, searchParams = {}, className = '') => {
  if (!listingDeleted) {
    const params = { id: listingId, slug: createSlug(label) };
    const to = { search: stringify(searchParams) };
    return (
      <NamedLink className={className} name="ListingPage" params={params} to={to}>
        {label}
      </NamedLink>
    );
  } else {
    return <FormattedMessage id="TransactionPanel.deletedListingOrderTitle" />;
  }
};

// Component to render the main heading for an order or a sale. Optionally also
// renders an info message based on the transaction state.
const PanelHeading = props => {
  const {
    className,
    rootClassName,
    processName,
    processState,
    showExtraInfo,
    showPriceOnMobile,
    price,
    intl,
    deliveryMethod,
    isPendingPayment,
    transactionRole,
    providerName,
    customerName,
    listingId,
    listingTitle,
    listingDeleted,
    isCustomerBanned,
    listing,
    nextStepTranslationId,
    lastCustomTransition = '',
  } = props;

  const isProvider = transactionRole === 'provider';
  const isCustomer = !isProvider;
  const { listingType, categoryLevel1 } = listing.attributes.publicData;

  const defaultRootClassName = isCustomer ? css.headingOrder : css.headingSale;
  const titleClasses = classNames(rootClassName || defaultRootClassName, className);
  const listingLink = createListingLink(listingId, listingTitle, listingDeleted);
  const breakline = <br />;
  const listingTranslationValues = {
    listingType: listingType?.replaceAll('-', '_'),
    categoryLevel1: categoryLevel1?.replaceAll('-', '_'),
  };

  return (
    <>
      <H1 className={titleClasses}>
        <span className={css.mainTitle}>
          <FormattedMessage
            id={`TransactionPage.${processName}.${transactionRole}.${processState}.title`}
            values={{
              customerName,
              providerName,
              breakline,
              deliveryMethod,
              lastCustomTransition,
              ...listingTranslationValues,
            }}
          />
        </span>
      </H1>
      <H2 className={css.listingTitleMobile}>
        <FormattedMessage id="TransactionPage.listingTitleMobile" values={{ listingLink }} />

        {showPriceOnMobile && price ? (
          <>
            <br />
            <span className={css.inquiryPrice}>{formatMoney(intl, price)}</span>
          </>
        ) : null}
      </H2>
      {!!intl.messages[nextStepTranslationId] && (
        <div className={css.nextStepContainer}>
          <span className={css.nextStepTitle}>
            {intl.formatMessage({ id: 'TransactionPage.nextStep' })}
          </span>
          <span>{intl.formatMessage({ id: nextStepTranslationId }, listingTranslationValues)}</span>
        </div>
      )}
      {isCustomer && listingDeleted ? (
        <p className={css.transactionInfoMessage}>
          <FormattedMessage id="TransactionPanel.messageDeletedListing" />
        </p>
      ) : null}
      {isCustomer && !listingDeleted && showExtraInfo ? (
        <p className={css.transactionInfoMessage}>
          <FormattedMessage
            id={`TransactionPage.${processName}.${transactionRole}.${processState}.extraInfo`}
            values={{ customerName, providerName, deliveryMethod, breakline }}
          />
        </p>
      ) : null}
      {isProvider && isPendingPayment ? (
        <p className={css.transactionInfoMessage}>
          <FormattedMessage
            id="TransactionPanel.salePaymentPendingInfo"
            values={{ customerName }}
          />
        </p>
      ) : null}
      {isProvider && isCustomerBanned ? (
        <p className={css.transactionInfoMessage}>
          <FormattedMessage id="TransactionPanel.customerBannedStatus" />
        </p>
      ) : null}
    </>
  );
};

export default PanelHeading;
