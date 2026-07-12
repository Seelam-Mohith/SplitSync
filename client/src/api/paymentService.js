import api from './axios';

const paymentService = {
  getMyPayments(groupId) {
    return api.get(`/payments/group/${groupId}`).then((r) => r.data.data.payments);
  },

  getDashboard(groupId) {
    return api.get(`/payments/group/${groupId}/dashboard`).then((r) => r.data.data);
  },

  getPayment(paymentId) {
    return api.get(`/payments/${paymentId}`).then((r) => r.data.data.payment);
  },

  submitPayment(paymentId) {
    return api.put(`/payments/${paymentId}/submit`).then((r) => r.data.data.payment);
  },

  verifyPayment(paymentId, remarks = '') {
    return api
      .put(`/payments/${paymentId}/verify`, { remarks })
      .then((r) => r.data.data.payment);
  },

  rejectPayment(paymentId, remarks = '') {
    return api
      .put(`/payments/${paymentId}/reject`, { remarks })
      .then((r) => r.data.data.payment);
  },

  updatePayment(paymentId, updates) {
    return api
      .put(`/payments/${paymentId}`, updates)
      .then((r) => r.data.data.payment);
  },

  createRazorpayOrder(paymentId) {
    return api
      .post(`/payments/${paymentId}/razorpay-order`)
      .then((r) => r.data.data);
  },

  verifyRazorpayPayment(payload) {
    return api
      .post(`/payments/${payload.paymentId}/razorpay-verify`, payload)
      .then((r) => r.data.data.payment);
  },

  updateUpiId(upiId) {
    return api.put('/user/profile', { upiId }).then((r) => r.data.data.user);
  },

  updateProfile(updates) {
    return api.put('/user/profile', updates).then((r) => r.data.data.user);
  },
};

export default paymentService;
