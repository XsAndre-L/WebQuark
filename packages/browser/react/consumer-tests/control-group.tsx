import React from 'react';
import { QControlGroup, QDropdown, QInput, QToggle } from '../src';

export const interval = (
  <QControlGroup ariaLabel="Sync interval" size="sm" orientation="horizontal">
    <QToggle label="Enabled" checked onQChange={event => { const enabled: boolean = event.detail; void enabled; }} />
    <QInput type="number" label="Amount" labelHidden value="5" />
    <QDropdown width="fit-options" label="Unit" labelHidden options={['Minutes', 'Hours']} />
  </QControlGroup>
);

// @ts-expect-error The group supports rows and columns, not arbitrary layout modes.
export const invalidOrientation = <QControlGroup orientation="diagonal" />;
