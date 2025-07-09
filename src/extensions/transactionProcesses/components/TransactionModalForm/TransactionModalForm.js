import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import { useIntl } from 'react-intl';

import { FieldLocationAutocompleteInput, FieldTextInput, Form, FieldSelect } from '../../../../components';
import { FIELD_LOCATION, FIELD_TEXT, FIELD_TEXTAREA, FIELD_SELECT } from '../../common/constants';
import { composeValidators } from '../../../../util/validators';

import css from './TransactionModalForm.module.css';
import { get, merge, set } from 'lodash';

const getField = ({ config, configIndex, intl, values }) => {
  const {
    type,
    labelTranslationId,
    placeholderTranslationId,
    name,
    initialValue,
    validators: validatorsConfig = [],
    options,
  } = config;

  const validators = Array.isArray(validatorsConfig)
    ? validatorsConfig.map(({ validatorFn, messageTranslationId }) =>
        validatorFn(intl.formatMessage({ id: messageTranslationId }))
      )
    : [];

  switch (type) {
    case FIELD_TEXT:
      return (
        <FieldTextInput
          key={configIndex}
          id={name}
          name={name}
          type="text"
          initialValue={initialValue}
          label={labelTranslationId && intl.formatMessage({ id: labelTranslationId })}
          placeholder={
            placeholderTranslationId && intl.formatMessage({ id: placeholderTranslationId })
          }
          validate={composeValidators(...validators)}
          className={css.fieldInput}
        />
      );

    case FIELD_TEXTAREA:
      return (
        <FieldTextInput
          key={configIndex}
          id={name}
          name={name}
          type="textarea"
          label={labelTranslationId && intl.formatMessage({ id: labelTranslationId })}
          placeholder={
            placeholderTranslationId && intl.formatMessage({ id: placeholderTranslationId })
          }
          validate={composeValidators(...validators)}
          className={css.fieldInput}
        />
      );

      case FIELD_SELECT:
      return (
        <FieldSelect
          key={configIndex}
          id={name}
          name={name}
          label={labelTranslationId && intl.formatMessage({ id: `${labelTranslationId}.label` })}
          validate={composeValidators(...validators)}
          className={css.fieldSelect}
        >
          {options.map(option => (
            <option key={option} value={option}>
              {intl.formatMessage({ id: `${labelTranslationId}.${option}` })}
            </option>
          ))}
        </FieldSelect>
      );
    case FIELD_LOCATION:
      return (
        <FieldLocationAutocompleteInput
          key={configIndex}
          name={name}
          label={labelTranslationId && intl.formatMessage({ id: labelTranslationId })}
          placeholder={
            placeholderTranslationId && intl.formatMessage({ id: placeholderTranslationId })
          }
          initialValue={initialValue}
          useDefaultPredictions={false}
          format={v => v}
          valueFromForm={values[name]}
          validate={composeValidators(...validators)}
          inputClassName={css.fieldLocationInput}
          rootClassName={css.fieldInput}
          iconClassName={css.locationAutocompleteInputIcon}
        />
      );
    default:
      return null;
  }
};

function TransactionModalForm({ onSubmit, formConfigs = [], ...restProps }) {
  const intl = useIntl();

  const handleSubmit = values => {
    const locationFields = formConfigs.filter(field => field.type === FIELD_LOCATION);
    const locationValues = locationFields.reduce((acc, current) => {
      const { name } = current;

      const value = get(values, name);
      set(acc, name, value?.selectedPlace?.address);
      set(acc, `${name}Geo`, value?.selectedPlace.origin);
      return acc;
    }, {});

    onSubmit(merge({}, values, locationValues));
  };

  return (
    <FinalForm
      onSubmit={handleSubmit}
      {...restProps}
      render={formRenderProps => {
        const { children, handleSubmit, values } = formRenderProps;

        const fields = Array.isArray(formConfigs)
          ? formConfigs.map((config, configIndex) =>
              getField({ config, configIndex, intl, values })
            )
          : [];

        return (
          <Form onSubmit={handleSubmit}>
            {fields}
            {children}
          </Form>
        );
      }}
    />
  );
}

export default TransactionModalForm;
