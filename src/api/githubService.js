/**
 * Service to handle GitHub API interactions
 * WARNING: Use a Personal Access Token (PAT) with 'repo' scope.
 */
export const githubService = {
  // Use the token from environment variables
  token: import.meta.env.VITE_GITHUB_TOKEN,
  owner: 'RedLab-Hosting', // Based on your previous push

  /**
   * Creates a new repository by cloning a template or creating a new one.
   * Since GitHub "Template" API is specific, we'll use the 'create repository' API.
   */
  async createCompanyRepo(name, description) {
    try {
      const response = await fetch(`https://api.github.com/orgs/${this.owner}/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          description: description || `Repository for ${name} - Prysma Core Branch`,
          private: false,
          has_issues: true,
          has_projects: false,
          has_wiki: false
        })
      });

      if (!response.ok) {
          const errorData = await response.json();
          // If not in an org, try creating in user account
          if (response.status === 404) {
             return this.createInUserAccount(name, description);
          }
          throw new Error(errorData.message || 'Failed to create repository');
      }

      return await response.json();
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw error;
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
