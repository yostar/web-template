import React from 'react';
import { string, bool } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import { propTypes } from '../../../util/types';
import {
  isErrorNoPermissionForInitiateTransactions,
  isErrorNoPermissionForUserPendingApproval,
  isTooManyRequestsError,
} from '../../../util/errors';

import {
  Form,
  PrimaryButton,
  FieldTextInput,
  IconInquiry,
  Heading,
  NamedLink,
} from '../../../components';

import ReminderBox from '../../../extensions/common/components/ReminderBox/ReminderBox';

import css from './InquiryForm.module.css';
import { NO_ACCESS_PAGE_INITIATE_TRANSACTIONS } from '../../../util/urlHelpers';

const ErrorMessage = props => {
  const { error } = props;
  const userPendingApproval = isErrorNoPermissionForUserPendingApproval(error);
  const userHasNoTransactionRights = isErrorNoPermissionForInitiateTransactions(error);

  // No transaction process attached to listing
  return error ? (
    <p className={css.error}>
      {error.message === 'No transaction process attached to listing' ? (
        <FormattedMessage id="InquiryForm.sendInquiryErrorNoProcess" />
      ) : isTooManyRequestsError(error) ? (
        <FormattedMessage id="InquiryForm.tooManyRequestsError" />
      ) : userPendingApproval ? (
        <FormattedMessage id="InquiryForm.userPendingApprovalError" />
      ) : userHasNoTransactionRights ? (
        <FormattedMessage
          id="InquiryForm.noTransactionRightsError"
          values={{
            NoAccessLink: msg => (
              <NamedLink
                name="NoAccessPage"
                params={{ missingAccessRight: NO_ACCESS_PAGE_INITIATE_TRANSACTIONS }}
              >
                {msg}
              </NamedLink>
            ),
          }}
        />
      ) : (
        <FormattedMessage id="InquiryForm.sendInquiryError" />
      )}
    </p>
  ) : null;
};

// Custom validator to check for phone numbers and email addresses
const noContactInfo = value => {
  const phonePattern = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/; // Simple pattern for phone numbers
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/; // Pattern for email addresses

  if (phonePattern.test(value)) {
    return <FormattedMessage id="InquiryForm.noPhoneNumberAllowed" />;
  }
  if (emailPattern.test(value)) {
    return <FormattedMessage id="InquiryForm.noEmailAllowed" />;
  }
  return undefined;
};


// NOTE: this InquiryForm is only for booking & purchase processes
// The default-inquiry process is handled differently
const InquiryFormComponent = props => (
  <FinalForm
    {...props}
    render={fieldRenderProps => {
      const {
        rootClassName,
        className,
        submitButtonWrapperClassName,
        formId,
        handleSubmit,
        inProgress,
        intl,
        listingTitle,
        authorDisplayName,
        sendInquiryError,
      } = fieldRenderProps;

      const messageLabel = intl.formatMessage(
        {
          id: 'InquiryForm.messageLabel',
        },
        { authorDisplayName }
      );
      const messagePlaceholder = intl.formatMessage(
        {
          id: 'InquiryForm.messagePlaceholder',
        },
        { authorDisplayName }
      );
      const messageRequiredMessage = intl.formatMessage({
        id: 'InquiryForm.messageRequired',
      });

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = submitInProgress;

      const messageRequired = validators.requiredAndNonEmptyString(messageRequiredMessage);
      const messageValidators = validators.composeValidators(messageRequired, noContactInfo);


      return (
        <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="OrderDetailsPage">
          <IconInquiry className={css.icon} />
          <Heading as="h2" rootClassName={css.heading}>
            <FormattedMessage id="InquiryForm.heading" values={{ listingTitle }} />
          </Heading>
          <FieldTextInput
            className={css.field}
            type="textarea"
            name="message"
            id={formId ? `${formId}.message` : 'message'}
            label={messageLabel}
            placeholder={messagePlaceholder}
            validate={messageValidators}
          />
          <ReminderBox />

          <div className={submitButtonWrapperClassName}>
            <ErrorMessage error={sendInquiryError} />
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="InquiryForm.submitButtonText" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

InquiryFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  submitButtonWrapperClassName: null,
  inProgress: false,
  sendInquiryError: null,
};

InquiryFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  submitButtonWrapperClassName: string,

  inProgress: bool,

  listingTitle: string.isRequired,
  authorDisplayName: string.isRequired,
  sendInquiryError: propTypes.error,

  // from injectIntl
  intl: intlShape.isRequired,
};

const InquiryForm = compose(injectIntl)(InquiryFormComponent);

InquiryForm.displayName = 'InquiryForm';

export default InquiryForm;
