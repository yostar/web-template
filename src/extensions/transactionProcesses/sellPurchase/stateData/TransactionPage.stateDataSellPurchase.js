import {
  TX_TRANSITION_ACTOR_CUSTOMER as CUSTOMER,
  TX_TRANSITION_ACTOR_PROVIDER as PROVIDER,
  CONDITIONAL_RESOLVER_WILDCARD,
  ConditionalResolver,
} from '../../../../transactions/transaction';
import { states, transitions } from '../transactions/transactionProcessSellPurchase';

/**
 * Get state data against product process for TransactionPage's UI.
 * I.e. info about showing action buttons, current state etc.
 *
 * @param {*} txInfo detials about transaction
 * @param {*} processInfo  details about process
 */
export const getStateDataForSellPurchaseProcess = (txInfo, processInfo) => {
  const { transaction, transactionRole, nextTransitions } = txInfo;

  const { sellerMarkMachinePlaced, buyerMarkMetManager } = transaction?.attributes?.metadata || {};
  const isProviderBanned = transaction?.provider?.attributes?.banned;
  const _ = CONDITIONAL_RESOLVER_WILDCARD;

  const {
    processName,
    processState,
    isCustomer,
    actionButtonProps,
    leaveReviewProps,
    markSellPurchaseProgressProps,
  } = processInfo;

  return new ConditionalResolver([processState, transactionRole])
    .cond([states.INQUIRY, CUSTOMER], () => {
      const transitionNames = Array.isArray(nextTransitions)
        ? nextTransitions.map(t => t.attributes.name)
        : [];
      const requestAfterInquiry = transitions.REQUEST_PAYMENT_AFTER_INQUIRY;
      const hasCorrectNextTransition = transitionNames.includes(requestAfterInquiry);
      const showOrderPanel = !isProviderBanned && hasCorrectNextTransition;
      return { processName, processState, showOrderPanel };
    })
    .cond([states.INQUIRY, PROVIDER], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.PURCHASE_CONFIRMED_BY_BUYER, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(
          transitions.BUYER_REFUND_BEFORE_SELLER_CONFIRMED,
          CUSTOMER,
          {
            isConfirmNeeded: true,
          }
        ),
      };
    })
    .cond([states.PURCHASE_CONFIRMED_BY_BUYER, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: actionButtonProps(transitions.SELLER_CONFIRM_PURCHASE, PROVIDER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          showReminderStatement: true,
        }),
        secondaryButtonProps: actionButtonProps(
          transitions.SELLER_REFUND_BEFORE_SELLER_CONFIRMED,
          PROVIDER,
          {
            isConfirmNeeded: true,
          }
        ),
      };
    })
    .cond([states.PAYMENT_EXPIRED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.REFUND_BEFORE_CAPTURE, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.PURCHASED, CUSTOMER], () => {
      const primaryButtonProps = buyerMarkMetManager
        ? {
            actionButtonTranslationId:
              'TransactionPage.sell-purchase.customer.transition-buyer-mark-complete-before-capture-intent.actionButton',
            actionButtonTranslationErrorId:
              'TransactionPage.sell-purchase.customer.transition-buyer-mark-complete-before-capture-intent.actionError',
            confirmStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchased.customer.confirmStatement',
            reminderStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchased.customer.reminderStatement',
          }
        : {
            actionButtonTranslationId:
              'TransactionPage.sell-purchase.customer.markMetManager.actionButton',
            actionButtonTranslationErrorId:
              'TransactionPage.sell-purchase.customer.markMetManager.actionError',
            confirmStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchased.customer.markMetManager.reminderStatement',
            reminderStatementTranslationId:
              'TransactionPage.PrimaryConfirmActionModal.sell-purchase.purchased.customer.markMetManager.confirmStatement',
          };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        primaryButtonProps: markSellPurchaseProgressProps(CUSTOMER, {
          isConfirmNeeded: true,
          showConfirmStatement: true,
          showReminderStatement: true,
          ...primaryButtonProps,
        }),
        secondaryButtonProps: actionButtonProps(
          transitions.BUYER_REFUND_BEFORE_CAPTURE_INTENT,
          CUSTOMER,
          {
            isConfirmNeeded: true,
          }
        ),
      };
    })
    .cond([states.PURCHASED, PROVIDER], () => {
      const primaryButtonMaybe = sellerMarkMachinePlaced
        ? {}
        : {
            primaryButtonProps: markSellPurchaseProgressProps(PROVIDER, {
              isConfirmNeeded: true,
              showConfirmStatement: true,
              showReminderStatement: true,
              actionButtonTranslationId:
                'TransactionPage.sell-purchase.provider.markMachinePlaced.actionButton',
              actionButtonTranslationErrorId:
                'TransactionPage.sell-purchase.provider.markMachinePlaced.actionError',
            }),
          };

      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showActionButtons: true,
        secondaryButtonProps: actionButtonProps(
          transitions.SELLER_REFUND_BEFORE_CAPTURE_INTENT,
          PROVIDER,
          {
            isConfirmNeeded: true,
            showReminderStatement: true,
          }
        ),
        ...primaryButtonMaybe,
      };
    })
    .cond([states.PURCHASE_EXPIRED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.STRIPE_INTENT_CAPTURED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.REFUND_DISABLED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.SELLER_HANDLE_DISPUTED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.OPERATOR_HANDLE_DISPUTED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.CANCELED, _], () => {
      return { processName, processState, showDetailCardHeadings: true };
    })
    .cond([states.COMPLETED, _], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsFirstLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_PROVIDER, CUSTOMER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED_BY_CUSTOMER, PROVIDER], () => {
      return {
        processName,
        processState,
        showDetailCardHeadings: true,
        showReviewAsSecondLink: true,
        showActionButtons: true,
        primaryButtonProps: leaveReviewProps,
      };
    })
    .cond([states.REVIEWED, _], () => {
      return { processName, processState, showDetailCardHeadings: true, showReviews: true };
    })
    .default(() => {
      // Default values for other states
      return { processName, processState, showDetailCardHeadings: true };
    })
    .resolve();
};
