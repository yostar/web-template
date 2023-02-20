/////////////////////////////////////////////////////////
// Configurations related to listing.                  //
// Main configuration here is the extended data config //
/////////////////////////////////////////////////////////

// NOTE: if you want to change the structure of the data,
// you should also check src/util/configHelpers.js
// some validation is added there.

/**
 * Configuration options for extended data fields:
 * - key:                           Unique key for the extended data field.
 * - scope (optional):              Scope of the extended data can be either 'public' or 'private'.
 *                                  Default value: 'public'.
 *                                  Note: listing doesn't support 'protected' scope atm.
 * - includeForListingTypes:        An array of listing types, for which the extended
 *   (optional)                     data is relevant and should be added.
 * - schemaType (optional):         Schema for this extended data field.
 *                                  This is relevant when rendering components and querying listings.
 *                                  Possible values: 'enum', 'multi-enum', 'text', 'long', 'boolean'.
 * - schemaOptions (optional):      Options shown for 'enum' and 'multi-enum' extended data.
 *                                  These are used to render options for inputs and filters on
 *                                  EditListingPage, ListingPage, and SearchPage.
 * - indexForSearch (optional):     If set as true, it is assumed that the extended data key has
 *                                  search index in place. I.e. the key can be used to filter
 *                                  listing queries (then scope needs to be 'public').
 *                                  Note: Flex CLI can be used to set search index for the key:
 *                                  https://www.sharetribe.com/docs/references/extended-data/#search-schema
 *                                  Read more about filtering listings with public data keys from API Reference:
 *                                  https://www.sharetribe.com/api-reference/marketplace.html#extended-data-filtering
 *                                  Default value: false,
 * - searchPageConfig:              Search-specific configuration.
 *   - filterType:                    Sometimes a single schemaType can be rendered with different filter components.
 *                                    For 'enum' schema, filterType can be 'SelectSingleFilter' or 'SelectMultipleFilter'
 *   - label:                         Label for the filter, if the field can be used as query filter
 *   - searchMode (optional):         Search mode for indexed data with multi-enum schema.
 *                                    Possible values: 'has_all' or 'has_any'.
 *   - group:                         SearchPageWithMap has grouped filters. Possible values: 'primary' or 'secondary'.
 * - listingPageConfig:             Configuration for rendering listing.
 *   - label:                         Label for the saved data.
 *   - isDetail                       Can be used to hide detail row (of type enum, boolean, or long) from listing page.
 *                                    Default value: true,
 * - editListingPageConfig:         Configuration for adding and modifying extended data fields.
 *   - label:                         Label for the input field.
 *   - placeholderMessage (optional): Default message for user input.
 *   - required (optional):           Is the field required for providers to fill
 *   - requiredMessage (optional):    Message for those fields, which are mandatory.
 */
export const listingExtendedData = [
  {
    key: 'category',
    scope: 'public',
    schemaType: 'enum',
    schemaOptions: [
      { option: 'city-bikes', label: 'City bikes' },
      { option: 'electric-bikes', label: 'Electric bikes' },
      { option: 'mountain-bikes', label: 'Mountain bikes' },
      { option: 'childrens-bikes', label: "Children's bikes" },
    ],
    indexForSearch: true,
    searchPageConfig: {
      filterType: 'SelectSingleFilter',
      label: 'Category',
      group: 'primary',
    },
    listingPageConfig: {
      label: 'Category',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Category',
      placeholderMessage: 'Select an option…',
      isRequired: true,
      requiredMessage: 'You need to select a category.',
    },
  },

  {
    key: 'tire-size',
    scope: 'public',
    schemaType: 'enum',
    schemaOptions: [
      { option: 29, label: '29' },
      { option: 28, label: '28' },
      { option: 27, label: '27' },
      { option: 26, label: '26' },
      { option: 24, label: '24' },
      { option: 20, label: '20' },
      { option: 18, label: '18' },
    ],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Tire size',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Tire size',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Tire size',
      placeholderMessage: 'Select an option…',
      isRequired: true,
      requiredMessage: 'You need to select a tire size.',
    },
  },
  {
    key: 'brand',
    scope: 'public',
    schemaType: 'enum',
    schemaOptions: [
      { option: 'cube', label: 'Cube' },
      { option: 'diamant', label: 'Diamant' },
      { option: 'ghost', label: 'GHOST' },
      { option: 'giant', label: 'Giant' },
      { option: 'kalkhoff', label: 'Kalkhoff' },
      { option: 'kona', label: 'Kona' },
      { option: 'otler', label: 'Otler' },
      { option: 'vermont', label: 'Vermont' },
    ],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Brand',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Brand',
      isDetail: true,
    },
    editListingPageConfig: {
      label: 'Brand',
      placeholderMessage: 'Select an option…',
      isRequired: true,
      requiredMessage: 'You need to select a brand.',
    },
  },
  {
    key: 'equipped-with',
    scope: 'public',
    schemaType: 'multi-enum',
    schemaOptions: [
      { option: 'bell', label: 'Bell' },
      { option: 'lights', label: 'Lights' },
      { option: 'lock', label: 'Lock' },
      { option: 'mudguard', label: 'Mudguard' },
    ],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Equipped with',
      searchMode: 'has_all',
      group: 'secondary',
    },
    listingPageConfig: {
      label: 'Equipped with',
    },
    editListingPageConfig: {
      label: 'Equipped with',
      placeholderMessage: 'Select an option…',
      isRequired: false,
    },
  },

  // // An example of how to use transaction type specific custom fields and private data.
  // {
  //   key: 'extra-note',
  //   scope: 'public',
  //   includeForListingTypes: ['product-selling'],
  //   schemaType: 'text',
  //   listingPageConfig: {
  //     label: 'Extra notes',
  //   },
  //   editListingPageConfig: {
  //     label: 'Extra notes',
  //     placeholderMessage: 'Some public extra note about this bike...',
  //   },
  // },
  // {
  //   key: 'private-note',
  //   scope: 'private',
  //   includeForListingTypes: ['daily-booking'],
  //   schemaType: 'text',
  //   editListingPageConfig: {
  //     label: 'Private notes',
  //     placeholderMessage: 'Some private note about this bike...',
  //   },
  // },
];

///////////////////////////////////////////////////////////////////////
// Configurations related to listing types and transaction processes //
///////////////////////////////////////////////////////////////////////

// A presets of supported listing configurations
//
// Note 1: With first iteration of hosted configs, we are unlikely to support
//         multiple listing types, even though this template has some
//         rudimentary support for it.
// Note 2: transaction type is part of listing type. It defines what transaction process and units
//         are used when transaction is created against a specific listing.

/**
 * Configuration options for listing experience:
 * - type:            Unique string. This will be saved to listing's public data on
 *                    EditListingWizard.
 * - label            Label for the listing type. Used as microcopy for options to select
 *                    listing type in EditListingWizard.
 * - transactionType  Set of configurations how this listing type will behave when transaction is
 *                    created.
 *   - process          Transaction process. This will be saved to listing's public data
 *                      (together with alias) as transctionProcessAlias.
 *                      The process must match one of the processes that this client app can handle
 *                      (check src/util/transaction.js) and the process must also exists in correct
 *                      marketplace environment.
 *   - alias            Valid alias for the aforementioned process.
 *   - unitType         Unit type is mainly used as pricing unit. This will be saved to
 *                      transaction's protected data.
 *                      Recommendation: don't use same unit types in completely different processes
 *                      ('item' sold should not be priced the same as 'item' booked).
 * - showStock        This is relevant only to listings with product-selling listing type.
 *                    If set to false, stock management is not showed and the listing is
 *                    considered unique (stock = 1).
 *                    Default: true.
 */

export const listingTypes = [
  {
    type: 'daily-booking',
    label: 'Daily booking',
    transactionType: {
      process: 'default-booking',
      alias: 'release-1',
      unitType: 'day',
    },
  },
  // Here are some examples for other listingTypes
  // TODO: SearchPage does not work well if both booking and product selling are used at the same time
  {
    type: 'nightly-booking',
    label: 'Nightly booking',
    transactionType: {
      process: 'default-booking',
      alias: 'release-1',
      unitType: 'night',
    },
  },
  {
    type: 'hourly-booking',
    label: 'Hourly booking',
    transactionType: {
      process: 'default-booking',
      alias: 'release-1',
      unitType: 'hour',
    },
  },
  {
    type: 'product-selling',
    label: 'Sell bicycles',
    transactionType: {
      process: 'default-purchase',
      alias: 'release-1',
      unitType: 'item',
    },
    showStock: true,
  },
];

// SearchPage can enforce listing query to only those listings with valid listingType
// However, it only works if you have set 'enum' type search schema for the public data fields
//   - listingType
//
//  Similar setup could be expanded to 2 other extended data fields:
//   - transactionProcessAlias
//   - unitType
//
// Read More:
// https://www.sharetribe.com/docs/how-to/manage-search-schemas-with-flex-cli/#adding-listing-search-schemas
export const enforceValidListingType = false;