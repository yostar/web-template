import React from 'react';
import { string, func, bool, oneOfType } from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { displayPrice } from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';

import { AspectRatioWrapper, NamedLink, ResponsiveImage } from '../../components';
import { getCategoryLabel } from '../../config/categories';


import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  if (price && price.currency === currency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

const PriceMaybe = props => {
  const { price, publicData, config, intl, uiCurrency } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(price, uiCurrency, intl);
  return (
    <div className={css.price}>
      <div className={css.priceValue} title={priceTitle}>
        {formattedPrice}
      </div>
      {isBookable ? (
        <div className={css.perUnit}>
          <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
        </div>
      ) : null}
    </div>
  );
};

export const ListingCardComponent = props => {
  const config = useConfiguration();
  const { uiCurrency } = useSelector(state => state.ui);
  const {
    className,
    rootClassName,
    intl,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', price, publicData } = currentListing.attributes;
  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;
  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

    //console.log("CURRENT LISTING", currentListing)

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

  const categoryLabel = getCategoryLabel(listing?.attributes?.publicData?.categoryLevel1);

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      <AspectRatioWrapper
        className={css.aspectRatioWrapper}
        width={aspectWidth}
        height={aspectHeight}
        {...setActivePropsMaybe}
      >
        <LazyImage
          rootClassName={css.rootForImage}
          alt={title}
          image={firstImage}
          variants={variants}
          sizes={renderSizes}
        />
      </AspectRatioWrapper>
      
      

      <div className={css.info}>
       
        <div className={css.priceInfo}>
          <PriceMaybe
            price={price}
            publicData={publicData}
            config={config}
            intl={intl}
            uiCurrency={uiCurrency}
          />
        </div>

        <div className={css.mainInfo}>
          
          <div className={css.title}>
            {richText(title, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
          </div>
          {categoryLabel && (<label className={css.category}>{categoryLabel}</label>)}
          
          {showAuthorInfo ? (
            <div className={css.authorInfo}>
              <FormattedMessage id="ListingCard.author" values={{ authorName }} />
            </div>
          ) : null}
        </div>
        
      </div>
      
    </NamedLink>
    
  );
};

ListingCardComponent.defaultProps = {
  className: null,
  rootClassName: null,
  renderSizes: null,
  setActiveListing: null,
  showAuthorInfo: true,
};

ListingCardComponent.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
  listing: oneOfType([propTypes.listing, propTypes.ownListing]).isRequired,
  showAuthorInfo: bool,

  // Responsive image sizes hint
  renderSizes: string,

  setActiveListing: func,
};

export default injectIntl(ListingCardComponent);
