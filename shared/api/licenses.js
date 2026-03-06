/**
 * shared/api/licenses.js  — License disk scan endpoints
 */
'use strict';

function createLicensesApi(api) {
  return {
    save:   (data)  => api.post('/licenses', data),
    list:   ()      => api.get('/licenses'),
    get:    (id)    => api.get(`/licenses/${id}`),
    link:   (id, bookingId) => api.patch(`/licenses/${id}`, { booking_id: bookingId }),
  };
}

module.exports = { createLicensesApi };
