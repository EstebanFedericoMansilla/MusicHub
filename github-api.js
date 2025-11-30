/**
 * GitHub API Module
 * Handles all interactions with GitHub GraphQL API
 */

class GitHubAPI {
    constructor(config) {
        this.owner = config.github.owner;
        this.repo = config.github.repo;
        this.categoryId = config.github.discussionCategoryId;
        this.token = config.github.accessToken;
        this.endpoint = config.api.graphqlEndpoint;
        this.corsProxy = config.api.corsProxy;
    }

    /**
     * Fetch discussions from GitHub
     * @param {number} limit - Number of discussions to fetch
     * @returns {Promise<Array>} Array of discussion objects
     */
    async fetchDiscussions(limit = 20) {
        const query = `
      query($owner: String!, $repo: String!, $categoryId: ID, $limit: Int!) {
        repository(owner: $owner, name: $repo) {
          discussions(first: $limit, categoryId: $categoryId, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              id
              title
              body
              createdAt
              updatedAt
              url
              author {
                login
                avatarUrl
                url
              }
              comments(first: 5) {
                totalCount
              }
              reactions(first: 1) {
                totalCount
              }
            }
          }
        }
      }
    `;

        const variables = {
            owner: this.owner,
            repo: this.repo,
            categoryId: this.categoryId || null,
            limit: limit
        };

        try {
            const response = await this.makeGraphQLRequest(query, variables);

            if (response.errors) {
                console.error('GraphQL Errors:', response.errors);
                throw new Error(response.errors[0].message);
            }

            return response.data.repository.discussions.nodes;
        } catch (error) {
            console.error('Error fetching discussions:', error);
            throw error;
        }
    }

    /**
     * Make GraphQL request to GitHub API
     * @param {string} query - GraphQL query
     * @param {Object} variables - Query variables
     * @returns {Promise<Object>} Response data
     */
    async makeGraphQLRequest(query, variables) {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if token is provided
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const url = this.corsProxy ? `${this.corsProxy}${this.endpoint}` : this.endpoint;

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Get repository information
     * @returns {Promise<Object>} Repository data
     */
    async getRepositoryInfo() {
        const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          name
          description
          url
          stargazerCount
          discussionCategories(first: 10) {
            nodes {
              id
              name
              description
            }
          }
        }
      }
    `;

        const variables = {
            owner: this.owner,
            repo: this.repo
        };

        try {
            const response = await this.makeGraphQLRequest(query, variables);
            return response.data.repository;
        } catch (error) {
            console.error('Error fetching repository info:', error);
            throw error;
        }
    }

    /**
     * Format discussion data for display
     * @param {Object} discussion - Raw discussion object
     * @returns {Object} Formatted discussion
     */
    formatDiscussion(discussion) {
        return {
            id: discussion.id,
            title: discussion.title,
            body: discussion.body,
            author: {
                username: discussion.author?.login || 'Unknown',
                avatar: discussion.author?.avatarUrl || '',
                profileUrl: discussion.author?.url || ''
            },
            createdAt: new Date(discussion.createdAt),
            updatedAt: new Date(discussion.updatedAt),
            url: discussion.url,
            commentsCount: discussion.comments?.totalCount || 0,
            reactionsCount: discussion.reactions?.totalCount || 0
        };
    }

    /**
     * Get time ago string from date
     * @param {Date} date - Date object
     * @returns {string} Human-readable time ago
     */
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60,
            segundo: 1
        };

        for (const [name, secondsInInterval] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInInterval);

            if (interval >= 1) {
                return interval === 1
                    ? `hace 1 ${name}`
                    : `hace ${interval} ${name}s`;
            }
        }

        return 'justo ahora';
    }

    /**
     * Validate configuration
     * @returns {Object} Validation result
     */
    validateConfig() {
        const errors = [];

        if (!this.owner || this.owner === 'YOUR_GITHUB_USERNAME') {
            errors.push('GitHub owner/username not configured');
        }

        if (!this.repo || this.repo === 'YOUR_REPO_NAME') {
            errors.push('GitHub repository name not configured');
        }

        if (!this.categoryId || this.categoryId === 'YOUR_CATEGORY_ID') {
            errors.push('Discussion category ID not configured');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubAPI;
}
