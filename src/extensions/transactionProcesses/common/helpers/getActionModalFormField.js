import { required } from '../../../../util/validators';
import { FIELD_TEXTAREA, FIELD_SELECT } from '../constants';
import { validRefundReasons } from './getRefundReasons';

export const validateRefundReason = (message) => (value) => {
  const validReasons = validRefundReasons();
  const VALID = undefined;
  return validReasons.includes(value) ? VALID : message;
};

export const getRefundReasonField = ({ role, name }) => ({
  type: FIELD_TEXTAREA,
  labelTranslationId: 'TransactionPage.RefundField.label',
  name: name || `protectedData.${role}DisputeReason`,
  validators: [
    { validatorFn: required, messageTranslationId: 'TransactionPage.RefundField.requiredMessage' },
  ],
});

export const getRefundSelectField = ({ role, name, options }) => ({
  type: FIELD_SELECT,
  labelTranslationId: 'TransactionPage.RefundSelectField',
  name: name || `protectedData.${role}DisputeReasonSelect`,
  options: options,
  validators: [
    { validatorFn: validateRefundReason, messageTranslationId: 'TransactionPage.RefundSelectField.requiredMessage' },
  ],
});

// Only for provider
export const getDisputeReasonField = () => ({
  type: FIELD_TEXTAREA,
  labelTranslationId: 'TransactionPage.DisputeField.label',
  name: 'protectedData.providerDisputeReason',
  validators: [
    { validatorFn: required, messageTranslationId: 'TransactionPage.DisputeField.requiredMessage' },
  ],
});
