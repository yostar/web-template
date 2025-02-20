import React, { useState } from 'react';
import classNames from 'classnames';
import { SquareCheck } from 'lucide-react';
import { useIntl } from 'react-intl';

import { Modal } from '../../../components';
import { PrimaryButton, SecondaryButton } from '../../../components';

import css from './TransactionPanel.module.css';
import modalCss from '../../../components/Modal/Modal.module.css';

// Functional component as a helper to build ActionButtons
const ActionButtonsMaybe = props => {
  const intl = useIntl();
  const [isPrimaryConfirmModalOpen, setIsPrimaryConfirmModalOpen] = useState(false);
  const [isSecondaryConfirmModalOpen, setIsSecondaryConfirmModalOpen] = useState(false);

  const {
    className,
    rootClassName,
    showButtons,
    primaryButtonProps,
    secondaryButtonProps,
    isListingDeleted,
    isProvider,
    transactionRole,
    processName,
    processState,
  } = props;

  // In default processes default processes need special handling
  // Booking: provider should not be able to accept on-going transactions
  // Product: customer should be able to dispute etc. on-going transactions
  if (isListingDeleted && isProvider) {
    return null;
  }

  const {
    inProgress: primaryInProgress,
    onAction: primaryOnAction,
    buttonText: primaryButtonText,
    isConfirmNeeded: primaryIsConfirmNeeded,
    showConfirmStatement: primaryShowConfirmStatement,
    showReminderStatement: primaryShowReminderStatement,
    confirmStatementTranslationId: primaryConfirmStatementTranslationId,
    reminderStatementTranslationId: primaryReminderStatementTranslationId,
    confirmButtonTranslationId: primaryConfirmButtonTranslationId,
    confirmModalTitleTranslationId: primaryConfirmModalTitleTranslationId,
    error: primaryError,
    errorText: primaryErrorText,
  } = primaryButtonProps || {};
  const {
    inProgress: secondaryInProgress,
    onAction: secondaryOnAction,
    buttonText: secondaryButtonText,
    isConfirmNeeded: secondaryIsConfirmNeeded,
    showConfirmStatement: secondaryShowConfirmStatement,
    showReminderStatement: secondaryShowReminderStatement,
    confirmStatementTranslationId: secondaryConfirmStatementTranslationId,
    reminderStatementTranslationId: secondaryReminderStatementTranslationId,
    confirmButtonTranslationId: secondaryConfirmButtonTranslationId,
    confirmModalTitleTranslationId: secondaryConfirmModalTitleTranslationId,
    error: secondaryError,
    errorText: secondaryErrorText,
  } = secondaryButtonProps || {};

  const buttonsDisabled = primaryInProgress || secondaryInProgress;

  const classes = classNames(rootClassName || css.actionButtons, className);

  // Handler to open confirmation modal
  const handleClick = ({ isConfirmNeeded, onAction, setConfirmModalOpen }) => {
    if (isConfirmNeeded) {
      setConfirmModalOpen(true);
      return;
    }

    onAction?.();
  };

  // Handler for confirming the action
  const handleConfirmModal = ({ setIsModalOpen, onAction }) => {
    setIsModalOpen(false);
    onAction?.();
  };

  const primaryButton = primaryButtonProps ? (
    <PrimaryButton
      inProgress={primaryInProgress}
      disabled={buttonsDisabled}
      onClick={() =>
        handleClick({
          isConfirmNeeded: primaryIsConfirmNeeded,
          onAction: primaryOnAction,
          setConfirmModalOpen: setIsPrimaryConfirmModalOpen,
        })
      }
    >
      {primaryError ? primaryErrorText : primaryButtonText}
    </PrimaryButton>
  ) : null;

  const primaryConfirmModal = primaryIsConfirmNeeded ? (
    <Modal
      id="PrimaryConfirmActionModal"
      isOpen={isPrimaryConfirmModalOpen}
      onClose={() => setIsPrimaryConfirmModalOpen(false)}
      onManageDisableScrolling={() => {}}
      closeButtonMessage="Close"
      containerClassName={modalCss.modalContainer}
      contentClassName={modalCss.modalContent}
    >
      <div>
        <h2 className="marketplaceModalTitleStyles">
          {intl.formatMessage({
            id:
              primaryConfirmModalTitleTranslationId ||
              'TransactionPage.PrimaryConfirmActionModal.modalTitle',
          })}
        </h2>

        {primaryShowConfirmStatement && (
          <p>
            {intl.formatMessage({
              id:
                primaryConfirmStatementTranslationId ||
                `TransactionPage.PrimaryConfirmActionModal.${processName}.${processState}.${transactionRole}.confirmStatement`,
            })}
          </p>
        )}

        {primaryShowReminderStatement && (
          <div className="reminderBox">
            <SquareCheck className={css.confirmModalCheckBoxIcon} />

            {intl.formatMessage({
              id:
                primaryReminderStatementTranslationId ||
                `TransactionPage.PrimaryConfirmActionModal.${processName}.${processState}.${transactionRole}.reminderStatement`,
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <PrimaryButton
            onClick={() =>
              handleConfirmModal({
                onAction: primaryOnAction,
                setIsModalOpen: setIsPrimaryConfirmModalOpen,
              })
            }
          >
            {intl.formatMessage({
              id:
                primaryConfirmButtonTranslationId ||
                'TransactionPage.PrimaryConfirmActionModal.confirmButton',
            })}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  ) : null;

  const secondaryButton = secondaryButtonProps ? (
    <SecondaryButton
      inProgress={secondaryInProgress}
      disabled={buttonsDisabled}
      onClick={() =>
        handleClick({
          isConfirmNeeded: secondaryIsConfirmNeeded,
          onAction: secondaryOnAction,
          setConfirmModalOpen: setIsSecondaryConfirmModalOpen,
        })
      }
    >
      {secondaryError ? secondaryErrorText : secondaryButtonText}
    </SecondaryButton>
  ) : null;

  const secondaryConfirmModal = secondaryIsConfirmNeeded ? (
    <Modal
      id="SecondaryConfirmActionModal"
      isOpen={isSecondaryConfirmModalOpen}
      onClose={() => setIsSecondaryConfirmModalOpen(false)}
      onManageDisableScrolling={() => {}}
      closeButtonMessage="Close"
      containerClassName={modalCss.modalContainer}
      contentClassName={modalCss.modalContent}
    >
      <div>
        <h2 className="marketplaceModalTitleStyles">
          {intl.formatMessage({
            id:
              secondaryConfirmModalTitleTranslationId ||
              'TransactionPage.SecondaryConfirmActionModal.modalTitle',
          })}
        </h2>

        {secondaryShowConfirmStatement && (
          <p>
            {intl.formatMessage({
              id:
                secondaryConfirmStatementTranslationId ||
                `TransactionPage.SecondaryConfirmActionModal.${processName}.${processState}.${transactionRole}.confirmStatement`,
            })}
          </p>
        )}

        {secondaryShowReminderStatement && (
          <div className="reminderBox">
            <SquareCheck className={css.confirmModalCheckBoxIcon} />

            {intl.formatMessage({
              id:
                secondaryReminderStatementTranslationId ||
                `TransactionPage.SecondaryConfirmActionModal.${processName}.${processState}.${transactionRole}.reminderStatement`,
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <PrimaryButton
            onClick={() =>
              handleConfirmModal({
                onAction: secondaryOnAction,
                setIsModalOpen: setIsSecondaryConfirmModalOpen,
              })
            }
          >
            {intl.formatMessage({
              id:
                secondaryConfirmButtonTranslationId ||
                'TransactionPage.SecondaryConfirmActionModal.confirmButton',
            })}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  ) : null;

  return showButtons ? (
    <>
      <div className={classes}>
        <div className={css.actionButtonWrapper}>
          {secondaryButton}
          {primaryButton}
        </div>
      </div>
      {primaryConfirmModal}
      {secondaryConfirmModal}
    </>
  ) : null;
};

export default ActionButtonsMaybe;
