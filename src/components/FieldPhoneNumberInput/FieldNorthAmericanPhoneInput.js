/**
 * A text field with North American phone number formatting.
 * Formats phone numbers as (XXX) XXX-XXXX
 */
import React from 'react';

import { FieldTextInput } from '../../components';
import { format, parse } from './northAmericanFormatter';

const FieldNorthAmericanPhoneInput = props => {
  const inputProps = {
    type: 'text',
    format: format,
    parse: parse,
    ...props,
  };

  return <FieldTextInput {...inputProps} />;
};

export default FieldNorthAmericanPhoneInput; 