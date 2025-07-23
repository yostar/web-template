import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import * as validators from '../../util/validators';

import { FieldNorthAmericanPhoneInput } from '../../components';

const UserFieldPhoneNumber = props => {
  const { rootClassName, className, formId, formName, userTypeConfig, intl } = props;

  const { displayInSignUp, required } = userTypeConfig?.phoneNumberSettings || {};
  const isDisabled = userTypeConfig?.defaultUserFields?.phoneNumber === false;
  const isAllowedInSignUp = displayInSignUp === true;

  if (isDisabled || !isAllowedInSignUp) {
    return null;
  }

  const isRequired = required === true;
  const validateMaybe = isRequired
    ? {
        validate: validators.composeValidators(
          validators.required(
            intl.formatMessage({
              id: `${formName}.phoneNumberRequired`,
            })
          ),
          validators.validNorthAmericanPhone(
            intl.formatMessage({
              id: `${formName}.phoneNumberInvalid`,
            })
          )
        ),
      }
    : {
        validate: validators.validNorthAmericanPhone(
          intl.formatMessage({
            id: `${formName}.phoneNumberInvalid`,
          })
        ),
      };

  return (
    <FieldNorthAmericanPhoneInput
      className={classNames(className, { [rootClassName]: !!rootClassName })}
      type="text"
      id={formId ? `${formId}.phoneNumber` : 'phoneNumber'}
      name="phoneNumber"
      label={intl.formatMessage({
        id: `${formName}.phoneNumberLabel`,
      })}
      placeholder={intl.formatMessage({
        id: `${formName}.phoneNumberPlaceholder`,
      })}
      {...validateMaybe}
    />
  );
};

UserFieldPhoneNumber.defaultProps = {
  rootClassName: null,
  className: null,
  formId: null,
};

UserFieldPhoneNumber.propTypes = {
  rootClassName: string,
  className: string,
  formId: string,
  formName: string.isRequired,
  userTypeConfig: propTypes.userType.isRequired,
  intl: intlShape.isRequired,
};

export default UserFieldPhoneNumber;
