/**
 * MusicHub - Main Application
 * Music social network powered by GitHub Discussions
 */

class MusicHub {
    constructor() {
        this.githubAPI = null;
        this.audioParser = new AudioParser();
        this.discussions = [];
        this.isLoading = false;
        this.autoRefreshTimer = null;

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🎵 Initializing MusicHub...');

        // Initialize GitHub API
        this.githubAPI = new GitHubAPI(CONFIG);

        // Set up event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadDiscussions();
        await this.loadLastComment();

        // Set up auto-refresh if enabled
        if (CONFIG.app.enableAutoRefresh) {
            this.startAutoRefresh();
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDiscussions();
                this.loadLastComment();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput && CONFIG.features.enableSearch) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
    }

    /**
     * Load discussions from GitHub
     */
    async loadDiscussions() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            console.log('📡 Fetching discussions...');
            const discussions = await this.githubAPI.fetchDiscussions(CONFIG.app.postsPerPage);

            // Format discussions
            this.discussions = discussions.map(d => this.githubAPI.formatDiscussion(d));

            console.log(`✅ Loaded ${this.discussions.length} discussions`);

            // Render discussions
            this.renderDiscussions(this.discussions);

        } catch (error) {
            console.error('❌ Error loading discussions:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render discussions to the feed
     * @param {Array} discussions - Array of formatted discussions
     */
    renderDiscussions(discussions) {
        const feedGrid = document.getElementById('feed-grid');
        if (!feedGrid) return;

        // Clear existing content
        feedGrid.innerHTML = '';

        if (discussions.length === 0) {
            this.showEmptyState();
            return;
        }

        // Render each discussion
        discussions.forEach((discussion, index) => {
            const card = this.createMusicCard(discussion, index);
            feedGrid.appendChild(card);
        });

        this.loadLastComment();
    }

    /**
     * Load the last comment
     */
    async loadLastComment() {
        const lastComment = new LastComment();
        await lastComment.init();
    }

    /**
     * Create a music card element
     * @param {Object} discussion - Formatted discussion object
     * @param {number} index - Card index for animation delay
     * @returns {HTMLElement} Card element
     */
    createMusicCard(discussion, index) {
        const card = document.createElement('div');
        card.className = 'music-card';
        card.style.animationDelay = `${index * 0.1}s`;

        // Parse audio from discussion body
        const audioData = this.audioParser.getFirstAudio(discussion.body);

        // Create card HTML
        card.innerHTML = `
      <div class="card-header">
        ${CONFIG.ui.showUserAvatars ? `
          <img src="${discussion.author.avatar}" alt="${discussion.author.username}" class="user-avatar">
        ` : ''}
        <div class="user-info">
          <div class="user-name">
            <a href="${discussion.author.profileUrl}" target="_blank" rel="noopener noreferrer">
              ${discussion.author.username}
            </a>
          </div>
          ${CONFIG.ui.showTimestamps ? `
            <div class="post-time">${this.githubAPI.getTimeAgo(discussion.createdAt)}</div>
          ` : ''}
        </div>
      </div>

      <div class="card-content">
        ${discussion.title ? `<h3>${this.escapeHtml(discussion.title)}</h3>` : ''}
        <div class="post-text">${this.formatPostText(discussion.body)}</div>
        
        ${audioData ? `
          <div class="audio-embed">
            ${audioData.embedHtml}
          </div>
        ` : ''}
      </div>

      ${CONFIG.features.enableComments ? `
        <div class="card-footer">
          <a href="${discussion.url}" target="_blank" class="card-action">
            💬 ${discussion.commentsCount} comentarios
          </a>
          ${CONFIG.features.enableLikes ? `
            <span class="card-action">
              ❤️ ${discussion.reactionsCount}
            </span>
          ` : ''}
        </div>
      ` : ''}
    `;

        return card;
    }

    /**
     * Format post text (remove URLs, add line breaks, etc.)
     * @param {string} text - Raw text
     * @returns {string} Formatted HTML
     */
    formatPostText(text) {
        if (!text) return '';

        // Remove audio URLs from display text
        let formattedText = text;
        const audioUrls = this.audioParser.parseText(text);
        audioUrls.forEach(audio => {
            formattedText = formattedText.replace(audio.url, '');
        });

        // Convert line breaks to <br>
        formattedText = formattedText.replace(/\n/g, '<br>');

        // Limit length
        const maxLength = 300;
        if (formattedText.length > maxLength) {
            formattedText = formattedText.substring(0, maxLength) + '...';
        }

        return this.escapeHtml(formattedText);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show loading state
     */
    showLoading() {
        const feedGrid = document.getElementById('feed-grid');
        if (!feedGrid) return;

        feedGrid.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Cargando música...</p>
      </div>
    `;
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        const feedGrid = document.getElementById('feed-grid');
        if (!feedGrid) return;

        feedGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎵</div>
        <h3>No hay publicaciones aún</h3>
        <p>¡Sé el primero en compartir tu música!</p>
      </div>
    `;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const feedGrid = document.getElementById('feed-grid');
        if (!feedGrid) return;

        feedGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Error al cargar</h3>
        <p>${this.escapeHtml(message)}</p>
        <button class="btn btn-primary" onclick="app.loadDiscussions()">
          Reintentar
        </button>
      </div>
    `;
    }

    /**
     * Handle search input
     * @param {string} query - Search query
     */
    handleSearch(query) {
        if (!query.trim()) {
            this.renderDiscussions(this.discussions);
            return;
        }

        const filtered = this.discussions.filter(d => {
            const searchText = `${d.title} ${d.body} ${d.author.username}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        this.renderDiscussions(filtered);
    }

    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }

        this.autoRefreshTimer = setInterval(() => {
            console.log('🔄 Auto-refreshing...');
            this.loadDiscussions();
        }, CONFIG.app.autoRefreshInterval);
    }

    /**
     * Stop auto-refresh timer
     */
    stopAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
            this.autoRefreshTimer = null;
        }
    }
}

class LastComment {
    constructor() {
      this.githubAPI = new GitHubAPI(CONFIG);
      this.lastComment = null;
      this.isLoading = false;
      this.error = null;
  
    }
  
    async init() {
      await this.fetchLastComment();
      this.render();
    }
  
    async fetchLastComment() {
      this.isLoading = true;
  
      const query = `
        query($owner: String!, $repo: String!, $categoryId: ID) {
          repository(owner: $owner, name: $repo) {
            discussions(first: 1, categoryId: $categoryId, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                comments(last: 1) {
                  nodes {
                    author {
                      login
                      avatarUrl
                    }
                    body
                    createdAt
                    url
                  }
                }
              }
            }
          }
        }
      `;
  
      const variables = {
        owner: this.githubAPI.owner,
        repo: this.githubAPI.repo,
        categoryId: this.githubAPI.categoryId,
      };
  
      try {
        const response = await this.githubAPI.makeGraphQLRequest(query, variables);
        if (response.errors) {
          throw new Error(response.errors[0].message);
        }
        const discussions = response.data.repository.discussions.nodes;
        if (discussions.length > 0 && discussions[0].comments.nodes.length > 0) {
          this.lastComment = discussions[0].comments.nodes[0];
        }
      } catch (error) {
        this.error = error;
        console.error('Error fetching last comment:', error);
      } finally {
        this.isLoading = false;
      }
    }
  
    render() {
      const container = document.getElementById('last-comment-container');
      if (!container) return;
  
      if (this.isLoading) {
        container.innerHTML = '<p>Cargando último comentario...</p>';
        return;
      }
  
      if (this.error) {
        container.innerHTML = `<p>Error al cargar el último comentario: ${this.error.message}</p>`;
        return;
      }
  
      if (!this.lastComment) {
        container.innerHTML = '<p>No hay comentarios aún.</p>';
        return;
      }
  
      const { author, body, createdAt, url } = this.lastComment;
      const timeAgo = this.githubAPI.getTimeAgo(new Date(createdAt));
  
      container.innerHTML = `
        <h3>Último comentario:</h3>
        <div class="last-comment">
          <img src="${author.avatarUrl}" alt="${author.login}" class="user-avatar">
          <div class="comment-content">
            <div class="comment-header">
              <strong>${author.login}</strong>
              <span class="comment-time">${timeAgo}</span>
            </div>
            <div class="comment-body">
              ${body}
            </div>
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="comment-link">Ver comentario</a>
          </div>
        </div>
      `;
    }
  }

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MusicHub();
});

// ============================================ 
//   Tutorial Modal Functions
// ============================================ 

/**
 * Open the main tutorials modal
 */
function openTutorialsModal(event) {
    event.preventDefault();
    const modal = document.getElementById('tutorialModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close the main tutorials modal
 */
function closeTutorialsModal() {
    const modal = document.getElementById('tutorialModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

/**
 * Toggle individual tutorial sections inside the modal
 * @param {string} id - The ID of the tutorial content element
 */
function toggleTutorial(id) {
    const content = document.getElementById(id);
    const toggle = document.getElementById(id + 'Toggle');
    if (content && toggle) {
        content.classList.toggle('open');
        toggle.classList.toggle('open');
    }
}

/**
 * Open the modal for viewing screenshot images
 * @param {string} src - The source URL of the image to display
 */
function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modal.style.display = 'block';
        modalImg.src = src;
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close the modal for viewing screenshot images
 */
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        // Only re-enable scrolling if the main tutorial modal is also closed
        if (document.getElementById('tutorialModal').style.display !== 'block') {
            document.body.style.overflow = '';
        }
    }
}
