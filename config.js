// Configuration for Music Social Network
const CONFIG = {
  // GitHub Repository Configuration
  github: {
    // IMPORTANT: Replace with your repository details
    owner: 'estebanfedericomansilla',
    repo: 'MusicHub',
    discussionCategoryId: 'DIC_kwDOQfkHY84CzM6n', // Get this from Giscus configuration

    // Optional: Personal Access Token for higher rate limits
    // Leave empty for public access (60 requests/hour)
    // With token: 5000 requests/hour
    accessToken: '', // Format: 'ghp_xxxxxxxxxxxx'
  },

  // API Configuration
  api: {
    graphqlEndpoint: 'https://api.github.com/graphql',
    corsProxy: '', // Optional CORS proxy if needed
  },

  // Application Settings
  app: {
    name: 'MusicHub',
    tagline: 'Comparte tu música con el mundo',
    postsPerPage: 20,
    autoRefreshInterval: 60000, // 60 seconds
    enableAutoRefresh: false,
  },

  // Audio Platform Support
  audio: {
    supportedPlatforms: ['soundcloud', 'youtube', 'spotify', 'bandcamp', 'direct'],
    maxEmbedHeight: 400,
  },

  // UI Configuration
  ui: {
    theme: 'dark', // 'dark' or 'light'
    accentColor: '#8b5cf6', // Purple accent
    showUserAvatars: true,
    showTimestamps: true,
    enableAnimations: true,
  },

  // Feature Flags
  features: {
    enableSearch: true,
    enableFilters: true,
    enableLikes: false, // GitHub reactions (requires auth)
    enableComments: true,
  },
};

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
