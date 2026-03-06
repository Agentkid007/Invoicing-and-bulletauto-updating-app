/**
 * shared/api/auth.js  — Auth endpoints (login, register, me)
 */
'use strict';

function createAuthApi(api) {
  return {
    login:    (email, password)              => api.post('/auth/login',    { email, password }),
    register: (name, email, phone, password) => api.post('/auth/register', { name, email, phone, password }),
    me:       ()                             => api.get('/auth/me'),
  };
}

module.exports = { createAuthApi };
