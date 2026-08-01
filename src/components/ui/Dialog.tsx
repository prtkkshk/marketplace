import React from 'react';
import { Sheet, type SheetProps } from './Sheet';

export type DialogProps = SheetProps;

export const Dialog: React.FC<DialogProps> = (props) => {
  return <Sheet {...props} />;
};
