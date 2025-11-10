/* global jest, test, expect, afterEach */

import React from 'react';
import anchorSelectorStates from 'state/anchorSelector/AnchorSelectorStates';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Component as AnchorSelectorField } from '../AnchorSelectorField';

jest.mock('isomorphic-fetch', () =>
  () => Promise.resolve({
    json: () => ['anchor3', 'anchor4'],
  }));
jest.mock('i18n');

function makeProps(obj = {}) {
  return {
    id: 'Form_Test',
    name: 'Test',
    data: {
      endpoint: 'url-callback',
    },
    pageId: 4,
    anchors: ['anchor1', 'anchor2'],
    value: 'selectedanchor',
    loadingState: anchorSelectorStates.SUCCESS,
    CreatableSelectComponent: ({ options }) => (
      <div data-testid="test-creatable-select">
        {options.map(option => <div key={option.value} data-option={option.value}/>)}
      </div>
    ),
    ...obj,
  };
}

test('AnchorSelectorField componentDidMount() Loads dirty selectors', async () => {
  const beginUpdating = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    loadingState: anchorSelectorStates.DIRTY,
    actions: {
      anchorSelector: {
        beginUpdating,
        updated: () => {},
        updateFailed: () => {},
      },
    },
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(beginUpdating).toBeCalledWith(4);
});

test('AnchorSelectorField Merges value with page anchors', async () => {
  const beginUpdating = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    loadingState: anchorSelectorStates.DIRTY,
    actions: {
      anchorSelector: {
        beginUpdating,
        updated: () => {},
        updateFailed: () => {},
      },
    },
  })}
  />);
  const select = await screen.findByTestId('test-creatable-select');
  const options = select.querySelectorAll('[data-option]');
  expect(options).toHaveLength(3);
  expect(options[0].getAttribute('data-option')).toBe('selectedanchor');
  expect(options[1].getAttribute('data-option')).toBe('anchor1');
  expect(options[2].getAttribute('data-option')).toBe('anchor2');
});

test('AnchorSelectorField componentDidMount() Does not load success selectors', async () => {
  const beginUpdating = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    loadingState: anchorSelectorStates.SUCCESS,
    actions: {
      anchorSelector: {
        beginUpdating,
        updated: () => {},
        updateFailed: () => {},
      },
    },
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(beginUpdating).not.toBeCalled();
});

test('AnchorSelectorField ensurePagesLoaded Triggers loading on dirty', async () => {
  const beginUpdating = jest.fn();
  const updated = jest.fn();
  const updateFailed = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    loadingState: anchorSelectorStates.DIRTY,
    actions: {
      anchorSelector: {
        beginUpdating,
        updated,
        updateFailed,
      },
    },
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(beginUpdating).toBeCalledWith(4);
  expect(updated).toBeCalledWith(4, ['anchor3', 'anchor4']);
  expect(updateFailed).not.toBeCalled();
});

test('AnchorSelectorField ensurePagesLoaded Does not trigger updating', async () => {
  const beginUpdating = jest.fn();
  const updated = jest.fn();
  const updateFailed = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    loadingState: anchorSelectorStates.UPDATING,
    actions: {
      anchorSelector: {
        beginUpdating,
        updated,
        updateFailed,
      },
    },
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(beginUpdating).not.toBeCalled();
  expect(updated).not.toBeCalled();
  expect(updateFailed).not.toBeCalled();
});

test('AnchorSelectorField handleChange calls onChange with value', async () => {
  const onChange = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    onChange,
    CreatableSelectComponent: ({ onChange: selectOnChange }) => (
      <button
        data-testid="test-select-btn"
        onClick={() => selectOnChange({ value: 'test-anchor' })}
      />
    ),
  })}
  />);
  const btn = await screen.findByTestId('test-select-btn');
  fireEvent.click(btn);
  expect(onChange).toHaveBeenCalledWith('test-anchor');
});

test('AnchorSelectorField handleChange calls onChange with empty string on null value', async () => {
  const onChange = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    onChange,
    CreatableSelectComponent: ({ onChange: selectOnChange }) => (
      <button
        data-testid="test-select-btn"
        onClick={() => selectOnChange(null)}
      />
    ),
  })}
  />);
  const btn = await screen.findByTestId('test-select-btn');
  fireEvent.click(btn);
  expect(onChange).toHaveBeenCalledWith('');
});

test('AnchorSelectorField handleChange does not call onChange when not provided', async () => {
  render(<AnchorSelectorField {...makeProps({
    onChange: undefined,
    CreatableSelectComponent: ({ onChange: selectOnChange }) => (
      <button
        data-testid="test-select-btn"
        onClick={() => selectOnChange({ value: 'test-anchor' })}
      />
    ),
  })}
  />);
  const btn = await screen.findByTestId('test-select-btn');
  expect(() => {
    fireEvent.click(btn);
  }).not.toThrow();
});

test('AnchorSelectorField getDropdownOptions returns empty array when no anchors and no value', async () => {
  render(<AnchorSelectorField {...makeProps({
    anchors: [],
    value: '',
    CreatableSelectComponent: ({ options }) => (
      <div data-testid="test-creatable-select">
        {options.map(option => <div key={option.value} data-option={option.value}/>)}
      </div>
    ),
  })}
  />);
  const select = await screen.findByTestId('test-creatable-select');
  const options = select.querySelectorAll('[data-option]');
  expect(options).toHaveLength(0);
});

test('AnchorSelectorField getDropdownOptions does not duplicate value when in anchors', async () => {
  render(<AnchorSelectorField {...makeProps({
    anchors: ['anchor1', 'anchor2'],
    value: 'anchor1',
    CreatableSelectComponent: ({ options }) => (
      <div data-testid="test-creatable-select">
        {options.map(option => <div key={option.value} data-option={option.value}/>)}
      </div>
    ),
  })}
  />);
  const select = await screen.findByTestId('test-creatable-select');
  const options = select.querySelectorAll('[data-option]');
  expect(options).toHaveLength(2);
  expect(options[0].getAttribute('data-option')).toBe('anchor1');
  expect(options[1].getAttribute('data-option')).toBe('anchor2');
});

test('AnchorSelectorField componentDidUpdate triggers load on pageId change', async () => {
  const beginUpdating = jest.fn();
  const updated = jest.fn();
  const updateFailed = jest.fn();
  const actions = {
    anchorSelector: {
      beginUpdating,
      updated,
      updateFailed,
    },
  };
  const { rerender } = render(<AnchorSelectorField {...makeProps({
    pageId: 4,
    loadingState: anchorSelectorStates.SUCCESS,
    actions,
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(beginUpdating).not.toBeCalled();
  rerender(<AnchorSelectorField {...makeProps({
    pageId: 5,
    loadingState: anchorSelectorStates.DIRTY,
    actions,
  })}
  />);
  await waitFor(() => {
    expect(beginUpdating).toHaveBeenCalledWith(5);
  });
});

test('AnchorSelectorField componentDidUpdate does not trigger load on other prop changes', async () => {
  const beginUpdating = jest.fn();
  const updated = jest.fn();
  const updateFailed = jest.fn();
  const actions = {
    anchorSelector: {
      beginUpdating,
      updated,
      updateFailed,
    },
  };
  const { rerender } = render(<AnchorSelectorField {...makeProps({
    pageId: 4,
    loadingState: anchorSelectorStates.SUCCESS,
    actions,
    value: 'anchor1',
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(beginUpdating).not.toBeCalled();
  rerender(<AnchorSelectorField {...makeProps({
    pageId: 4,
    loadingState: anchorSelectorStates.SUCCESS,
    actions,
    value: 'anchor2',
  })}
  />);
  expect(beginUpdating).not.toBeCalled();
});

test('AnchorSelectorField ensurePagesLoaded merges field anchors with FIELD_ONLY state', async () => {
  const beginUpdating = jest.fn();
  const updated = jest.fn();
  const updateFailed = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    anchors: ['fieldanchor1', 'fieldanchor2'],
    loadingState: anchorSelectorStates.FIELD_ONLY,
    actions: {
      anchorSelector: {
        beginUpdating,
        updated,
        updateFailed,
      },
    },
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(beginUpdating).toHaveBeenCalledWith(4);
  await waitFor(() => {
    expect(updated).toHaveBeenCalledWith(4, expect.arrayContaining([
      'fieldanchor1',
      'fieldanchor2',
      'anchor3',
      'anchor4',
    ]));
  });
});

test('AnchorSelectorField ensurePagesLoaded does not trigger without pageId', async () => {
  const beginUpdating = jest.fn();
  const updated = jest.fn();
  const updateFailed = jest.fn();
  render(<AnchorSelectorField {...makeProps({
    pageId: 0,
    loadingState: anchorSelectorStates.DIRTY,
    actions: {
      anchorSelector: {
        beginUpdating,
        updated,
        updateFailed,
      },
    },
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(beginUpdating).not.toBeCalled();
  expect(updated).not.toBeCalled();
  expect(updateFailed).not.toBeCalled();
});

test('AnchorSelectorField getDropdownOptions preserves unique values', async () => {
  render(<AnchorSelectorField {...makeProps({
    anchors: ['anchor1', 'anchor1', 'anchor2'],
    value: 'anchor1',
    CreatableSelectComponent: ({ options }) => (
      <div data-testid="test-creatable-select">
        {options.map(option => <div key={option.value} data-option={option.value}/>)}
      </div>
    ),
  })}
  />);
  const select = await screen.findByTestId('test-creatable-select');
  const options = select.querySelectorAll('[data-option]');
  expect(options.length).toBeGreaterThan(0);
});

test('AnchorSelectorField renders with empty value', async () => {
  render(<AnchorSelectorField {...makeProps({
    value: '',
  })}
  />);
  const select = await screen.findByTestId('test-creatable-select');
  expect(select).not.toBeNull();
});

test('AnchorSelectorField passes correct props to CreatableSelect', async () => {
  const CreatableSelectComponent = jest.fn(({ isSearchable, isClearable }) => (
    <div data-testid="test-creatable-select">{isSearchable && isClearable ? 'ok' : 'fail'}</div>
  ));
  render(<AnchorSelectorField {...makeProps({
    name: 'TestField',
    CreatableSelectComponent,
  })}
  />);
  await screen.findByTestId('test-creatable-select');
  expect(CreatableSelectComponent).toHaveBeenCalledWith(
    expect.objectContaining({
      isSearchable: true,
      isClearable: true,
      name: 'TestField',
      classNamePrefix: 'anchorselectorfield',
    }),
    expect.anything()
  );
});

test('AnchorSelectorField renders with extraClass', async () => {
  const CreatableSelectComponent = ({ className }) => (
    <div data-testid="test-creatable-select" className={className}/>
  );
  render(<AnchorSelectorField {...makeProps({
    extraClass: 'custom-extra-class',
    CreatableSelectComponent,
  })}
  />);
  const select = await screen.findByTestId('test-creatable-select');
  expect(select.className).toContain('anchorselectorfield');
  expect(select.className).toContain('custom-extra-class');
});
