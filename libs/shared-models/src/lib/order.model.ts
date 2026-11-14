export enum OrderType {
  EPIN = 1,
  PRODUCT = 2,
  PACKAGE = 3,
  UPGRADE = 4,
  SERVICE = 5,
}

export enum OrderStatus {
  Draft = 1,
  PendingPayment = 2,
  PaymentReceived = 3,
  Approved = 4,
  Rejected = 5,
  Completed = 6,
  Cancelled = 7,
}

export enum PaymentMode {
  Offline = 1,
  Online = 2,
}

export enum PaymentMethod {
  Cash = 1,
  UPI = 2,
  BankTransfer = 3,
  Cheque = 4,
  NetBanking = 5,
  Card = 6,
  Razorpay = 7,
  PhonePe = 8,
  Paytm = 9,
}

export enum ReferenceType {
  ORDER = 1,
  PRODUCT = 2,
  EPIN = 3,
  UPGRADE = 4,
  SERVICE = 5,
  WALLET = 6,
}

export enum PaymentStatus {
  Pending = 1,
  Verified = 2,
  Failed = 3,
  Rejected = 4,
  Cancelled = 5,
  Refunded = 6,
}

export interface CreateOrderItem {
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface OfflinePaymentRequest {
  paymentMethod: string;
  referenceNumber: string;
  paymentDate: string;
  mediaFileId: number;
  remarks: string;
}

export interface CreateOrderRequest {
  orderType: string;
  paymentMode: string;
  remarks: string;
  items: CreateOrderItem[];
  offlinePayment: OfflinePaymentRequest | null;
}

export interface OrderListItem {
  id: number;
  orderNo: string;
  orderType: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  createdDate: string;
}

export interface OrderItemDetail {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface StatusHistoryItem {
  fromStatus: string | null;
  toStatus: string;
  remarks: string;
  changedOn: string;
}

export interface OrderDetail {
  id: number;
  orderNo: string;
  orderType: string;
  status: string;
  totalAmount: number;
  remarks: string;
  paymentMode: string;
  createdDate: string;
  approvedOn: string | null;
  rejectedReason: string | null;
  items: OrderItemDetail[];
  statusHistory: StatusHistoryItem[];
}

export interface AdminOrderListItem {
  id: number;
  orderNo: string;
  memberId: number;
  registrationNumber: string;
  memberName: string;
  sponsorId: number;
  sponsorName: string;
  mobile: string;
  email: string;
  package: string | null;
  rank: number | null;
  memberStatus: string;
  orderType: string;
  totalAmount: number;
  paymentMode: string;
  paymentStatus: string | null;
  orderStatus: string;
  totalItems: number;
  createdDate: string;
  pendingSinceDays: number | null;
  approvedBy: string | null;
  approvedDate: string | null;
}

export interface AdminOrderSummary {
  totalOrders: number;
  pendingPaymentOrders: number;
  paymentReceivedOrders: number;
  approvedOrders: number;
  rejectedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayOrders: number;
  thisMonthOrders: number;
  totalOrderAmount: number;
  pendingPaymentAmount: number;
  receivedPaymentAmount: number;
}

export interface AdminOrderListResponse {
  orders: AdminOrderListItem[];
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface AdminOrderMember {
  id: number;
  regNo: number;
  registrationNumber: string;
  memberName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  packageName: string | null;
  rank: string | null;
  memberStatus: string;
}

export interface AdminOrderSponsor {
  id: number;
  regNo: number;
  registrationNumber: string;
  sponsorName: string;
  mobile: string;
}

export interface AdminOrderAudit {
  createdByName: string;
  approvedByName: string | null;
}

export interface AdminOrderDetail {
  id: number;
  orderNo: string;
  orderType: string;
  status: string;
  paymentMode: string;
  paymentStatus: string | null;
  totalAmount: number;
  remarks: string;
  totalItems: number;
  createdDate: string;
  approvedOn: string | null;
  rejectedReason: string | null;
  items: OrderItemDetail[];
  member: AdminOrderMember;
  sponsor: AdminOrderSponsor;
  statusHistory: StatusHistoryItem[];
  audit: AdminOrderAudit;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface OrderListParams {
  search?: string;
  orderType?: number;
  status?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminOrderListParams {
  search?: string;
  orderType?: number;
  orderStatus?: number;
  paymentStatus?: number;
  dateFrom?: string;
  dateTo?: string;
  loginId?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
}

export interface PaymentHistoryItem {
  fromStatus: string | null;
  toStatus: string;
  remarks: string;
  changedOn: string;
  changedByName: string | null;
}

export interface PaymentDetail {
  id: number;
  paymentNo: string;
  referenceType: string;
  referenceId: number;
  amount: number;
  paymentMode: string;
  paymentMethod: string;
  status: string;
  transactionReference: string;
  gatewayTransactionId: string | null;
  mediaFileId: number | null;
  mediaFileUrl: string | null;
  remarks: string;
  paidOn: string;
  verifiedOn: string | null;
  verifiedByName: string | null;
  createdDate: string;
  history: PaymentHistoryItem[];
}

export interface AdminPaymentListItem {
  id: number;
  paymentNo: string;
  memberId: number;
  registrationNumber: string;
  memberName: string;
  mobile: string;
  referenceType: string;
  referenceId: number;
  amount: number;
  paymentMode: string;
  paymentMethod: string;
  status: string;
  transactionReference: string;
  paidOn: string;
  createdDate: string;
}

export interface AdminPaymentDetail extends PaymentDetail {
  member: {
    id: number;
    regNo: number;
    memberName: string;
    mobile: string;
    email: string;
  };
  audit: {
    createdByName: string;
    verifiedByName: string | null;
  };
}

export interface PaymentListParams {
  search?: string;
  referenceType?: number;
  status?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminPaymentListParams extends PaymentListParams {
  paymentMode?: number;
}
