/**
 * Design Patterns Index
 * Export all pattern implementations
 */

export { UserFactory, userFactory } from './UserFactory';
export {
  IPaymentStrategy,
  IPaymentResult,
  PaymentContext,
  UPIPaymentStrategy,
  CardPaymentStrategy,
  WalletPaymentStrategy,
  paymentContext
} from './PaymentStrategy';
export {
  IQueueObserver,
  IQueueSubject,
  QueueManager,
  queueManager
} from './QueueObserver';
