import i18n from 'i18n';
import React, { useEffect } from 'react';
import fetch from 'isomorphic-fetch';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { formValueSelector } from 'redux-form';
import * as anchorSelectorActions from 'state/anchorSelector/AnchorSelectorActions';
import anchorSelectorStates from 'state/anchorSelector/AnchorSelectorStates';
import fieldHolder from 'components/FieldHolder/FieldHolder';
import CreatableSelect from 'react-select/creatable';
import EmotionCssCacheProvider from 'containers/EmotionCssCacheProvider/EmotionCssCacheProvider';
import getFormState from 'lib/getFormState';
import classnames from 'classnames';
import PropTypes from 'prop-types';

const noop = () => null;

const AnchorSelectorField = ({
  extraClass = '',
  name,
  onChange,
  value = '',
  pageId,
  anchors = [],
  loadingState,
  onLoadingError = noop,
  data,
  CreatableSelectComponent = CreatableSelect,
  actions,
}) => {
  const handleLoadingError = (error) => {
    if (onLoadingError === noop) {
      throw error;
    }
    // Custom error handling
    return onLoadingError({
      errors: [
        {
          value: error.message,
          type: 'error',
        },
      ],
    });
  };

  /**
   * Lazy-triggers load of the dropdown based on pageId
   *
   * @param {Object} props - Props to check
   * @return {Promise} The promise object
   */
  const ensurePagesLoaded = () => {
    // Only load if dirty and a valid ID
    if (
      loadingState === anchorSelectorStates.UPDATING
      || loadingState === anchorSelectorStates.SUCCESS
      || !pageId
    ) {
      return Promise.resolve();
    }
    // Get anchors that belong to the current field
    let fieldAnchors = [];
    if (loadingState === anchorSelectorStates.FIELD_ONLY) {
      fieldAnchors = anchors;
    }
    // Mark page updating
    actions.anchorSelector.beginUpdating(pageId);
    // Query endpoint for anchors for this page
    const fetchURL = data.endpoint.replace(/:id/, pageId);
    return fetch(fetchURL, { credentials: 'same-origin' })
      .then(response => response.json())
      .then((fetchedAnchors) => {
        // Fold in field anchors and ensure array has only unique values
        const allAnchors = [...new Set([...fetchedAnchors, ...fieldAnchors])];
        // Update anchors
        actions.anchorSelector.updated(pageId, allAnchors);
        return allAnchors;
      })
      .catch((error) => {
        actions.anchorSelector.updateFailed(pageId);
        handleLoadingError(error);
      });
  };

  /**
   * Get options
   *
   * @return {Array}
   */
  const getDropdownOptions = () => {
    const options = anchors.map(anchorValue => ({ value: anchorValue }));
    // Ensure value is available in the list
    if (value && !anchors.find(anchorValue => anchorValue === value)) {
      options.unshift({ value });
    }
    return options;
  };

  /**
   * Handles changes to the selected anchor
   *
   * @param {String} selectedValue
   */
  const handleChange = (selectedValue) => {
    if (typeof onChange === 'function') {
      onChange(selectedValue ? selectedValue.value : '');
    }
  };

  useEffect(() => {
    ensurePagesLoaded();
  }, [pageId]);

  const className = classnames('anchorselectorfield', extraClass);
  const options = getDropdownOptions();
  const rawValue = value || '';
  const placeholder = i18n._t('CMS.ANCHOR_SELECT_OR_TYPE', 'Select or enter anchor');

  return (
    <EmotionCssCacheProvider>
      <CreatableSelectComponent
        isSearchable
        isClearable
        options={options}
        className={className}
        name={name}
        onChange={handleChange}
        value={{ value: rawValue }}
        noOptionsMessage={() => i18n._t('CMS.ANCHOR_NO_OPTIONS', 'No options')}
        placeholder={placeholder}
        getOptionLabel={({ value: optionValue }) => optionValue}
        classNamePrefix="anchorselectorfield"
      />
    </EmotionCssCacheProvider>
  );
};

AnchorSelectorField.propTypes = {
  extraClass: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  value: PropTypes.string,
  pageId: PropTypes.number,
  anchors: PropTypes.array,
  loadingState: PropTypes.oneOf(Object
    .keys(anchorSelectorStates)
    .map((key) => anchorSelectorStates[key])),
  onLoadingError: PropTypes.func,
  data: PropTypes.shape({
    endpoint: PropTypes.string,
    targetFieldName: PropTypes.string,
  }),
  CreatableSelectComponent: PropTypes.elementType,
  actions: PropTypes.shape({
    anchorSelector: PropTypes.object,
  }),
};

function mapStateToProps(state, ownProps) {
  // Get pageId From selector field
  const selector = formValueSelector(ownProps.formid, getFormState);
  const targetFieldName = (ownProps && ownProps.data && ownProps.data.targetFieldName) || 'PageID';
  const pageId = Number(selector(state, targetFieldName) || 0);
  // Load anchors from page
  let anchors = [];
  const page = pageId
    ? state.cms.anchorSelector.pages.find(next => next.id === pageId)
    : null;
  if (page
    && (
      page.loadingState === anchorSelectorStates.SUCCESS
      || page.loadingState === anchorSelectorStates.DIRTY
      || page.loadingState === anchorSelectorStates.FIELD_ONLY
    )
  ) {
    // eslint-disable-next-line prefer-destructuring
    anchors = page.anchors;
  }
  // Check status
  let loadingState = null;
  if (page) {
    // eslint-disable-next-line prefer-destructuring
    loadingState = page.loadingState;
  } else if (pageId) {
    // Triggers an update
    loadingState = anchorSelectorStates.DIRTY;
  } else {
    // No page = success
    loadingState = anchorSelectorStates.SUCCESS;
  }
  return { pageId, anchors, loadingState };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: {
      anchorSelector: bindActionCreators(anchorSelectorActions, dispatch),
    },
  };
}

const ConnectedAnchorSelectorField
  = connect(mapStateToProps, mapDispatchToProps)(AnchorSelectorField);

export { AnchorSelectorField as Component, ConnectedAnchorSelectorField };

export default fieldHolder(ConnectedAnchorSelectorField);
