import api from './api';

async function getData(request) {
  const response = await request;
  return response.data.data;
}

const dashboardService = {
  getAdminDashboard: () => getData(api.get('/users/admin/dashboard')),
  getStaffDashboard: () => getData(api.get('/moderator/dashboard'))
};

export default dashboardService;
