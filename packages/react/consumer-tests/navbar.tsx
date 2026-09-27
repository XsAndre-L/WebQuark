import React from 'react';
import { QNavbar } from '../src';
import type { QNavbarNavAlign, QNavbarNavCenterWithin } from '@webquark/core';

const alignment: QNavbarNavAlign = 'center';
const reference: QNavbarNavCenterWithin = 'container';
export const centeredNavbar = <QNavbar navAlign={alignment} navCenterWithin={reference} sticky />;

// @ts-expect-error Unsupported alignment must not silently become an arbitrary string.
export const invalidAlignment = <QNavbar navAlign="middle" />;
// @ts-expect-error Viewport centring is deliberately outside this API.
export const invalidReference = <QNavbar navCenterWithin="viewport" />;
