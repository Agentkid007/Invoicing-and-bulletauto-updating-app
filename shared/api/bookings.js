/**
 * shared/api/bookings.js  — Bookings CRUD + notes
 */
'use strict';

function createBookingsApi(api) {
  return {
    list:         ()          => api.get('/bookings'),
    get:          (id)        => api.get(`/bookings/${id}`),
    create:       (data)      => api.post('/bookings', data),
    update:       (id, patch) => api.patch(`/bookings/${id}`, patch),
    delete:       (id)        => api.delete(`/bookings/${id}`),
    getNotes:     (id)        => api.get(`/bookings/${id}/notes`),
    addNote:      (id, form)  => {
      // form-data POST — caller must pass a FormData instance
      throw new Error('Use direct fetch for multipart form-data notes');
    },
    stats:        ()          => api.get('/stats'),
    clients:      ()          => api.get('/clients'),
    serviceTypes: ()          => api.get('/service-types'),
  };
}

module.exports = { createBookingsApi };
