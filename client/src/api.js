const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  // Generate new posts with AI
  generatePosts: async () => {
    const response = await fetch(`${API_BASE_URL}/generate-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  // Publish ready posts
  publishPosts: async () => {
    const response = await fetch(`${API_BASE_URL}/publish-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  // Get all posts
  getPosts: async () => {
    const response = await fetch(`${API_BASE_URL}/posts`);
    return response.json();
  },

  // Update post status
  updatePostStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  // Update entire post
  updatePost: async (id, postData) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    return response.json();
  },

  // Create manual post
  createPost: async (postData) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    return response.json();
  },

  // Archive post
  archivePost: async (id) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};