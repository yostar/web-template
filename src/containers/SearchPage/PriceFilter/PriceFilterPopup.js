import React, { Component } from 'react';
import { arrayOf, func, node, number, shape, string } from 'prop-types';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { formatCurrencyMajorUnit } from '../../../util/currency';

import { OutsideClickHandler } from '../../../components';

import PopupOpenerButton from '../PopupOpenerButton/PopupOpenerButton';
import PriceFilterForm from '../PriceFilterForm/PriceFilterForm';
import css from './PriceFilterPopup.module.css';

const KEY_CODE_ESCAPE = 27;
const RADIX = 10;

const getPriceQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames)
    ? queryParamNames[0]
    : typeof queryParamNames === 'string'
    ? queryParamNames
    : 'price';
};

// Parse value, which should look like "0,1000"
const parse = priceRange => {
  const [minPrice, maxPrice] = !!priceRange
    ? priceRange.split(',').map(v => Number.parseInt(v, RADIX))
    : [];
  // Note: we compare to null, because 0 as minPrice is falsy in comparisons.
  return !!priceRange && minPrice != null && maxPrice != null ? { minPrice, maxPrice } : null;
};

// Format value, which should look like { minPrice, maxPrice }
const format = (range, queryParamName) => {
  const { minPrice, maxPrice } = range || {};
  // Note: we compare to null, because 0 as minPrice is falsy in comparisons.
  const value = minPrice != null && maxPrice != null ? `${minPrice},${maxPrice}` : null;
  return { [queryParamName]: value };
};

class PriceFilterPopup extends Component {
  constructor(props) {
    super(props);

    this.state = { isOpen: false };
    this.filter = null;
    this.filterContent = null;

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.toggleOpen = this.toggleOpen.bind(this);
    this.positionStyleForContent = this.positionStyleForContent.bind(this);
  }

  handleSubmit(values) {
    const { onSubmit, queryParamNames, marketplaceCurrency } = this.props;
    this.setState({ isOpen: false });
    const priceQueryParamName = getPriceQueryParamName(queryParamNames);
    const updateParams = {
      ...format(values, priceQueryParamName),
      currency: marketplaceCurrency,
    };

    onSubmit(updateParams);
  }

  handleClear() {
    const { onSubmit, queryParamNames } = this.props;
    this.setState({ isOpen: false });
    const priceQueryParamName = getPriceQueryParamName(queryParamNames);
    onSubmit(format(null, priceQueryParamName));
  }

  handleCancel() {
    const { onSubmit, initialValues } = this.props;
    this.setState({ isOpen: false });
    onSubmit(initialValues);
  }

  handleBlur() {
    this.setState({ isOpen: false });
  }

  handleKeyDown(e) {
    // Gather all escape presses to close menu
    if (e.keyCode === KEY_CODE_ESCAPE) {
      this.toggleOpen(false);
    }
  }

  toggleOpen(enforcedState) {
    if (enforcedState) {
      this.setState({ isOpen: enforcedState });
    } else {
      this.setState(prevState => ({ isOpen: !prevState.isOpen }));
    }
  }

  positionStyleForContent() {
    if (this.filter && this.filterContent) {
      // Render the filter content to the right from the menu
      // unless there's no space in which case it is rendered
      // to the left
      const distanceToRight = window.innerWidth - this.filter.getBoundingClientRect().right;
      const labelWidth = this.filter.offsetWidth;
      const contentWidth = this.filterContent.offsetWidth;
      const contentWidthBiggerThanLabel = contentWidth - labelWidth;
      const renderToRight = distanceToRight > contentWidthBiggerThanLabel;
      const contentPlacementOffset = this.props.contentPlacementOffset;

      const offset = renderToRight
        ? { left: contentPlacementOffset }
        : { right: contentPlacementOffset };
      // set a min-width if the content is narrower than the label
      const minWidth = contentWidth < labelWidth ? { minWidth: labelWidth } : null;

      return { ...offset, ...minWidth };
    }
    return {};
  }

  render() {
    const {
      rootClassName,
      className,
      id,
      label,
      queryParamNames,
      initialValues,
      min,
      max,
      step,
      intl,
      marketplaceCurrency,
    } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    const priceQueryParam = getPriceQueryParamName(queryParamNames);
    const initialPrice =
      initialValues && initialValues[priceQueryParam] ? parse(initialValues[priceQueryParam]) : {};
    const { minPrice, maxPrice } = initialPrice || {};

    const hasValue = value => value != null;
    const hasInitialValues = initialValues && hasValue(minPrice) && hasValue(maxPrice);

    const currentLabel = hasInitialValues
      ? intl.formatMessage(
          { id: 'PriceFilter.labelSelectedButton' },
          {
            minPrice: formatCurrencyMajorUnit(intl, marketplaceCurrency, minPrice),
            maxPrice: formatCurrencyMajorUnit(intl, marketplaceCurrency, maxPrice),
          }
        )
      : label
      ? label
      : intl.formatMessage({ id: 'PriceFilter.label' });

    const labelStyles = hasInitialValues ? css.labelSelected : css.label;
    const contentStyle = this.positionStyleForContent();

    return (
      <OutsideClickHandler onOutsideClick={this.handleBlur}>
        <div
          className={classes}
          onKeyDown={this.handleKeyDown}
          ref={node => {
            this.filter = node;
          }}
        >
          <PopupOpenerButton isSelected={hasInitialValues} toggleOpen={this.toggleOpen}>
            {currentLabel}
          </PopupOpenerButton>

          <PriceFilterForm
            id={id}
            initialValues={hasInitialValues ? initialPrice : { minPrice: min, maxPrice: max }}
            onClear={this.handleClear}
            onCancel={this.handleCancel}
            onSubmit={this.handleSubmit}
            intl={intl}
            contentRef={node => {
              this.filterContent = node;
            }}
            style={contentStyle}
            min={min}
            max={max}
            step={step}
            showAsPopup
            isOpen={this.state.isOpen}
          />
        </div>
      </OutsideClickHandler>
    );
  }
}

PriceFilterPopup.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  contentPlacementOffset: 0,
  liveEdit: false,
  step: number,
};

PriceFilterPopup.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  label: node,
  queryParamNames: arrayOf(string).isRequired,
  onSubmit: func.isRequired,
  initialValues: shape({
    price: string,
  }),
  contentPlacementOffset: number,
  min: number.isRequired,
  max: number.isRequired,
  step: number,
  marketplaceCurrency: string.isRequired,

  // form injectIntl
  intl: intlShape.isRequired,
};

export default injectIntl(PriceFilterPopup);
