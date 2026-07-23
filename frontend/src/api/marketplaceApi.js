import axiosClient from './axiosClient';

export const getMarketCampaigns = async () => {
  return await axiosClient.get('/market/campaigns');
};

export const applyToCampaign = async (campaignId, data) => {
  return await axiosClient.post(`/market/campaigns/${campaignId}/apply`, data);
};

export const getCampaignApplications = async (campaignId) => {
  return await axiosClient.get(`/market/campaigns/${campaignId}/applications`);
};

export const updateApplicationStatus = async (applicationId, status) => {
  return await axiosClient.put(`/market/applications/${applicationId}/status`, { status });
};

export const toggleRecruiting = async (campaignId, isLookingForKol) => {
  return await axiosClient.patch(`/market/campaigns/${campaignId}/toggle-recruiting`, { isLookingForKol });
};

const marketplaceApi = {
  getMarketCampaigns,
  applyToCampaign,
  getCampaignApplications,
  updateApplicationStatus,
  toggleRecruiting,
};

export default marketplaceApi;
