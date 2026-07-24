import axiosClient from './axiosClient';

export const analyticsApi = {
  getMyBusinessAnalytics: () => axiosClient.get('/analytics/my-business'),
  getBusinessAnalyticsById: (businessId) => axiosClient.get(`/businesses/${businessId}/analytics`),
  scrapeUrl: (url) => axiosClient.post('/analytics/scrape-url', { url }),
};
