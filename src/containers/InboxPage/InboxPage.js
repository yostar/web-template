import React, { useState, useEffect } from 'react';
import { arrayOf, bool, number, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import {
  propTypes,
  DATE_TYPE_DATE,
  DATE_TYPE_DATETIME,
  LINE_ITEM_NIGHT,
  LINE_ITEM_HOUR,
  LISTING_UNIT_TYPES,
  STOCK_MULTIPLE_ITEMS,
} from '../../util/types';
import { subtractTime } from '../../util/dates';
import {
  TX_TRANSITION_ACTOR_CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER,
  resolveLatestProcessName,
  getProcess,
  isBookingProcess,
} from '../../transactions/transaction';

import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import {
  H2,
  Avatar,
  NamedLink,
  NotificationBadge,
  Page,
  PaginationLinks,
  TabNav,
  IconSpinner,
  TimeRange,
  UserDisplayName,
  LayoutSideNavigation,
} from '../../components';

import { Inbox } from 'lucide-react';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import NotFoundPage from '../../containers/NotFoundPage/NotFoundPage';
import { Search, MessagesSquare } from 'lucide-react';
import { stateDataShape, getStateData } from './InboxPage.stateData';
import css from './InboxPage.module.css';

// Check if the transaction line-items use booking-related units
const getUnitLineItem = lineItems => {
  const unitLineItem = lineItems?.find(
    item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
  );
  return unitLineItem;
};

// Booking data (start & end) are bit different depending on display times and
// if "end" refers to last day booked or the first exclusive day
const bookingData = (tx, lineItemUnitType, timeZone) => {
  // Attributes: displayStart and displayEnd can be used to differentiate shown time range
  // from actual start and end times used for availability reservation. It can help in situations
  // where there are preparation time needed between bookings.
  // Read more: https://www.sharetribe.com/api-reference/marketplace.html#bookings
  const { start, end, displayStart, displayEnd } = tx.booking.attributes;
  const bookingStart = displayStart || start;
  const bookingEndRaw = displayEnd || end;

  // When unit type is night, we can assume booking end to be inclusive.
  const isNight = lineItemUnitType === LINE_ITEM_NIGHT;
  const isHour = lineItemUnitType === LINE_ITEM_HOUR;
  const bookingEnd =
    isNight || isHour ? bookingEndRaw : subtractTime(bookingEndRaw, 1, 'days', timeZone);

  return { bookingStart, bookingEnd };
};

const BookingTimeInfoMaybe = props => {
  const { transaction, ...rest } = props;
  const processName = resolveLatestProcessName(transaction?.attributes?.processName);
  const process = getProcess(processName);
  const isInquiry = process.getState(transaction) === process.states.INQUIRY;

  if (isInquiry) {
    return null;
  }

  const hasLineItems = transaction?.attributes?.lineItems?.length > 0;
  const unitLineItem = hasLineItems
    ? transaction.attributes?.lineItems?.find(
        item => LISTING_UNIT_TYPES.includes(item.code) && !item.reversal
      )
    : null;

  const lineItemUnitType = unitLineItem ? unitLineItem.code : null;
  const dateType = lineItemUnitType === LINE_ITEM_HOUR ? DATE_TYPE_DATETIME : DATE_TYPE_DATE;

  const timeZone = transaction?.listing?.attributes?.availabilityPlan?.timezone || 'Etc/UTC';
  const { bookingStart, bookingEnd } = bookingData(transaction, lineItemUnitType, timeZone);

  return (
    <TimeRange
      startDate={bookingStart}
      endDate={bookingEnd}
      dateType={dateType}
      timeZone={timeZone}
      {...rest}
    />
  );
};

BookingTimeInfoMaybe.propTypes = {
  transaction: propTypes.transaction.isRequired,
};

export const InboxItem = props => {
  const {
    transactionRole,
    tx,
    intl,
    stateData,
    isBooking,
    stockType = STOCK_MULTIPLE_ITEMS,
    currentUser,
  } = props;
  const { customer, provider, listing, messages = [] } = tx;
  const { processName, processState, actionNeeded, isSaleNotification, isFinal } = stateData;
  const isCustomer = transactionRole === TX_TRANSITION_ACTOR_CUSTOMER;
  const { listingType, categoryLevel1 } = listing?.attributes?.publicData || {};

  const lineItems = tx.attributes?.lineItems;
  const hasPricingData = lineItems.length > 0;
  const unitLineItem = getUnitLineItem(lineItems);
  const quantity = hasPricingData && !isBooking ? unitLineItem.quantity.toString() : null;
  const showStock = stockType === STOCK_MULTIPLE_ITEMS || (quantity && unitLineItem.quantity > 1);

  const otherUser = isCustomer ? provider : customer;
  const otherUserDisplayName = <UserDisplayName user={otherUser} intl={intl} />;
  const isOtherUserBanned = otherUser.attributes.banned;

  const isLastMessageUnreplied =
    messages &&
    messages.length > 0 &&
    messages[messages.length - 1].sender.id.uuid !== currentUser.id.uuid;
  const rowNotificationDot =
    isSaleNotification || isLastMessageUnreplied ? <div className={css.notificationDot} /> : null;

  const getMessageComponent = () => {
    if (messages.length === 0) {
      return null;
    }
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.attributes) {
      return null;
    }

    const { content: rawMessageContent, createdAt: messageCreatedAt } = lastMessage.attributes;
    const { displayName } = lastMessage.sender.attributes.profile;
    const messageContent = `${displayName}: ${rawMessageContent}`;
    const messageDate = new Date(messageCreatedAt).toLocaleDateString();

    return (
      <div className={css.itemMessage}>
        <div className={css.messageContainer}>
          <MessagesSquare className={css.messageIcon} />
          <span className={css.messageContent}>{messageContent}</span>
        </div>
        <span className={css.messageDate}> {messageDate}</span>
      </div>
    );
  };

  const linkClasses = classNames(css.itemLink, {
    [css.bannedUserLink]: isOtherUserBanned,
  });
  const stateClasses = classNames(css.stateName, {
    [css.stateConcluded]: isFinal,
    [css.stateActionNeeded]: actionNeeded,
    [css.stateNoActionNeeded]: !actionNeeded,
  });

  return (
    <div className={css.item}>
      <div className={css.itemAvatar}>
        <Avatar user={otherUser} />
      </div>
      <NamedLink
        className={linkClasses}
        name={isCustomer ? 'OrderDetailsPage' : 'SaleDetailsPage'}
        params={{ id: tx.id.uuid }}
      >
        <div className={css.rowNotificationDot}>{rowNotificationDot}</div>
        <div className={css.itemUsername}>{otherUserDisplayName}</div>
        <div className={css.itemTitle}>{listing?.attributes?.title}</div>

        <div className={css.itemDetails}>
          {isBooking ? (
            <BookingTimeInfoMaybe transaction={tx} />
          ) : hasPricingData && showStock ? (
            <FormattedMessage id="InboxPage.quantity" values={{ quantity }} />
          ) : null}
        </div>
        <div className={css.itemState}>
          <div className={stateClasses}>
            <FormattedMessage
              id={`InboxPage.${processName}.${processState}.status`}
              values={{
                transactionRole,
                listingType: listingType?.replaceAll('-', '_'),
                categoryLevel1: categoryLevel1?.replaceAll('-', '_'),
              }}
            />
          </div>
        </div>
        {getMessageComponent()}
      </NamedLink>
    </div>
  );
};

InboxItem.propTypes = {
  transactionRole: oneOf([TX_TRANSITION_ACTOR_CUSTOMER, TX_TRANSITION_ACTOR_PROVIDER]).isRequired,
  tx: propTypes.transaction.isRequired,
  intl: intlShape.isRequired,
  stateData: stateDataShape.isRequired,
  currentUser: propTypes.currentUser,
};

export const InboxPageComponent = props => {
  const config = useConfiguration();
  const {
    currentUser,
    fetchInProgress,
    fetchOrdersOrSalesError,
    intl,
    pagination,
    params,
    providerNotificationCount,
    scrollingDisabled,
    transactions,
    initialSearchQuery,
  } = props;
  const { tab } = params;
  const validTab = tab === 'orders' || tab === 'sales';
  if (!validTab) {
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const handleSearchChange = event => {
    const newQuery = event.target.value;
    setSearchQuery(newQuery);
    sessionStorage.setItem('searchQuery', newQuery); // Store the search query in sessionStorage
  };

  // Filter transactions based on the local search query
  const filteredTransactions = transactions.filter(tx => {
    const { customer, provider, listing, messages } = tx;
    const searchLower = searchQuery.toLowerCase();

    const customerName = customer.attributes.profile.displayName?.toLowerCase();
    const providerName = provider.attributes.profile.displayName?.toLowerCase();
    const listingTitle = listing.attributes.title?.toLowerCase();
    const messageContents = messages.map(msg => msg.attributes.content.toLowerCase());

    return (
      customerName?.includes(searchLower) ||
      providerName?.includes(searchLower) ||
      listingTitle?.includes(searchLower) ||
      messageContents.some(content => content.includes(searchLower))
    );
  });

  const isOrders = tab === 'orders';
  const hasNoResults =
    !fetchInProgress && filteredTransactions.length === 0 && !fetchOrdersOrSalesError;
  const ordersTitle = intl.formatMessage({ id: 'InboxPage.ordersTitle' });
  const salesTitle = intl.formatMessage({ id: 'InboxPage.salesTitle' });
  const title = isOrders ? ordersTitle : salesTitle;

  const pickType = lt => conf => conf.listingType === lt;
  const findListingTypeConfig = publicData => {
    const listingTypeConfigs = config.listing?.listingTypes;
    const listingCategoryConfigs = config.categoryConfiguration.categories;
    const { listingType, categoryLevel1 } = publicData || {};

    const { transactionType: transactionTypeCategoryConfig, stockType: stockTypeCategoryConfig } =
      listingCategoryConfigs.find(conf => conf.id === categoryLevel1) || {};
    const {
      transactionType: transactionTypeListingTypeConfig,
      stockType: stockTypeListingTypeConfig,
    } = listingTypeConfigs?.find(pickType(listingType)) || {};

    const foundConfig = {
      transactionType: transactionTypeCategoryConfig || transactionTypeListingTypeConfig,
      stockType: stockTypeCategoryConfig || stockTypeListingTypeConfig,
    };
    return foundConfig;
  };
  const toTxItem = tx => {
    const transactionRole = isOrders ? TX_TRANSITION_ACTOR_CUSTOMER : TX_TRANSITION_ACTOR_PROVIDER;
    let stateData = null;
    try {
      stateData = getStateData({ transaction: tx, transactionRole, intl });
    } catch (error) {
      // If stateData is missing, omit the transaction from InboxItem list.
    }

    const publicData = tx?.listing?.attributes?.publicData || {};
    const foundListingTypeConfig = findListingTypeConfig(publicData);
    const { transactionType, stockType } = foundListingTypeConfig || {};
    const process = tx?.attributes?.processName || transactionType?.transactionType;
    const transactionProcess = resolveLatestProcessName(process);
    const isBooking = isBookingProcess(transactionProcess);

    // Render InboxItem only if the latest transition of the transaction is handled in the `txState` function.
    return stateData ? (
      <li key={tx.id.uuid} className={css.listItem}>
        <InboxItem
          transactionRole={transactionRole}
          tx={tx}
          intl={intl}
          stateData={stateData}
          stockType={stockType}
          isBooking={isBooking}
          currentUser={currentUser}
        />
      </li>
    ) : null;
  };

  const hasOrderOrSaleTransactions = (tx, isOrdersTab, user) => {
    return isOrdersTab
      ? user?.id && tx && tx.length > 0 && tx[0].customer.id.uuid === user?.id?.uuid
      : user?.id && tx && tx.length > 0 && tx[0].provider.id.uuid === user?.id?.uuid;
  };
  const hasTransactions =
    !fetchInProgress && hasOrderOrSaleTransactions(transactions, isOrders, currentUser);

  const tabs = [
    {
      text: (
        <span>
          <FormattedMessage id="InboxPage.ordersTabTitle" />
        </span>
      ),
      selected: isOrders,
      linkProps: {
        name: 'InboxPage',
        params: { tab: 'orders' },
      },
    },
    {
      text: (
        <span>
          <FormattedMessage id="InboxPage.salesTabTitle" />
          {providerNotificationCount > 0 ? (
            <NotificationBadge count={providerNotificationCount} />
          ) : null}
        </span>
      ),
      selected: !isOrders,
      linkProps: {
        name: 'InboxPage',
        params: { tab: 'sales' },
      },
    },
  ];

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        sideNavClassName={css.navigation}
        topbar={
          <TopbarContainer
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
          />
        }
        sideNav={
          <>
            <div className={css.titleContainer}>
              <H2 as="h1" className={css.title}>
                <Inbox className={css.inboxIcon} /> <FormattedMessage id="InboxPage.title" />
              </H2>
              <div className={css.searchContainer}>
                <Search className={css.searchIcon} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={css.searchBox}
                />
              </div>
            </div>
            <TabNav rootClassName={css.tabs} tabRootClassName={css.tab} tabs={tabs} />
          </>
        }
        footer={<FooterContainer />}
      >
        {fetchOrdersOrSalesError ? (
          <p className={css.error}>
            <FormattedMessage id="InboxPage.fetchFailed" />
          </p>
        ) : null}
        <ul className={css.itemList}>
          {!fetchInProgress ? (
            filteredTransactions.map(toTxItem)
          ) : (
            <li className={css.listItemsLoading}>
              <IconSpinner />
            </li>
          )}
          {hasNoResults ? (
            <li key="noResults" className={css.noResults}>
              <FormattedMessage
                id={
                  searchQuery
                    ? 'InboxPage.noResults'
                    : isOrders
                    ? 'InboxPage.noOrdersFound'
                    : 'InboxPage.noSalesFound'
                }
              />
            </li>
          ) : null}
        </ul>
        {hasTransactions && pagination && pagination.totalPages > 1 ? (
          <PaginationLinks
            className={css.pagination}
            pageName="InboxPage"
            pagePathParams={params}
            pagination={pagination}
          />
        ) : null}
      </LayoutSideNavigation>
    </Page>
  );
};

InboxPageComponent.defaultProps = {
  currentUser: null,
  fetchOrdersOrSalesError: null,
  pagination: null,
  providerNotificationCount: 0,
  sendVerificationEmailError: null,
};

InboxPageComponent.propTypes = {
  params: shape({
    tab: string.isRequired,
  }).isRequired,

  currentUser: propTypes.currentUser,
  fetchInProgress: bool.isRequired,
  fetchOrdersOrSalesError: propTypes.error,
  pagination: propTypes.pagination,
  providerNotificationCount: number,
  scrollingDisabled: bool.isRequired,
  transactions: arrayOf(propTypes.transaction).isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const {
    fetchInProgress,
    fetchOrdersOrSalesError,
    pagination,
    transactionRefs,
    initialSearchQuery,
  } = state.InboxPage;
  const { currentUser, currentUserNotificationCount: providerNotificationCount } = state.user;
  return {
    currentUser,
    fetchInProgress,
    fetchOrdersOrSalesError,
    pagination,
    providerNotificationCount,
    initialSearchQuery,
    scrollingDisabled: isScrollingDisabled(state),
    transactions: getMarketplaceEntities(state, transactionRefs),
  };
};

const InboxPage = compose(connect(mapStateToProps), injectIntl)(InboxPageComponent);

export default InboxPage;
