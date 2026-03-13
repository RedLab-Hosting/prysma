/**
 * Service to handle GitHub API interactions
 * WARNING: Use a Personal Access Token (PAT) with 'repo' scope.
 */
export const githubService = {
  // Use the token from environment variables
  token: import.meta.env.VITE_GITHUB_TOKEN,
  owner: 'RedLab-Hosting', // Based on your previous push

  /**
   * Creates a new repository based on the Prysma Kernel template.
   * Note: The source repository (prysma) MUST be marked as a "Template repository" on GitHub.
   */
  async createCompanyRepo(name, description) {
    try {
      // Template repository is 'prysma'
      const templateRepo = 'prysma';
      
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${templateRepo}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          owner: this.owner,
          name: name,
          description: description || `Repository for ${name} - Prysma Core Branch`,
          include_all_branches: false,
          private: false
        })
      });

      if (!response.ok) {
          const errorData = await response.json();
          // Fallback if not an org or template not found
          if (response.status === 404 || response.status === 403) {
             console.warn('Template generation failed, falling back to empty repo creation...', errorData);
             return this.createInUserAccount(name, description);
          }
          throw new Error(errorData.message || 'Failed to generate repository from template');
      }

      return await response.json();
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw error;
    }
  },

  /**
   * Enables GitHub Pages for a repository.
   * Note: It configures 'main' branch and '/' path.
   */
  async enablePages(repoName) {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${repoName}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: {
            branch: 'main',
            path: '/'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Could not enable GitHub Pages automatically:', errorData.message);
        return { success: false, error: errorData.message };
      }

      return { success: true, data: await response.json() };
    } catch (error) {
      console.error('Error enabling GH Pages:', error);
      return { success: false, error: error.message };
    }
  },

  async createInUserAccount(name, description) {
    const response = await fetch(`https://api.github.com/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          description: description,
          private: false
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create repository in user account');
    return data;
  }
};
