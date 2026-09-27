export type QToastId = string;

export type QToastVariant = 'info' | 'success' | 'warning' | 'danger';

export type QToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

export interface QToastOptions {
  duration?: number;
  dismissible?: boolean;
}

export interface QToastRequest extends QToastOptions {
  title: string;
  description?: string;
  variant: QToastVariant;
}

export interface QToastItem {
  id: QToastId;
  title: string;
  description?: string;
  variant: QToastVariant;
  duration: number;
  dismissible: boolean;
  exiting: boolean;
}

export interface QToastController {
  info(title: string, description?: string, options?: QToastOptions): QToastId;
  success(title: string, description?: string, options?: QToastOptions): QToastId;
  warning(title: string, description?: string, options?: QToastOptions): QToastId;
  danger(title: string, description?: string, options?: QToastOptions): QToastId;
  error(title: string, description?: string, options?: QToastOptions): QToastId;
  dismiss(id: QToastId): boolean;
  clear(): number;
}
