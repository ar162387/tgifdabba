import apiClient from './apiClient';

export const contactService = {
  // Submit a contact form
  submitContact: async (contactData) => {
    const response = await apiClient.post('/contact', contactData);
    return response.data;
  }
};

export default contactService;
