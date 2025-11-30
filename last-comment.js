
class LastComment {
  constructor() {
    this.githubAPI = new GitHubAPI(CONFIG);
    this.lastComment = null;
    this.isLoading = false;
    this.error = null;

    this.init();
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
