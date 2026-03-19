import sodium from 'libsodium-wrappers';

/**
 * Service to handle GitHub API interactions
 * WARNING: Use a Personal Access Token (PAT) with 'repo' and 'workflow' scope.
 */
export const githubService = {
  // Use the token from environment variables
  token: import.meta.env.VITE_GITHUB_TOKEN,
  owner: 'RedLab-Hosting', // Based on your previous push

  /**
   * Sets a secret in the repository for GitHub Actions.
   * Encrypts the value using libsodium as required by GitHub API.
   */
  async setSecret(repoName, secretName, secretValue) {
    try {
      await sodium.ready;
      
      // 1. Get the public key for the repository
      const keyResponse = await fetch(`https://api.github.com/repos/${this.owner}/${repoName}/actions/secrets/public-key`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!keyResponse.ok) {
        const err = await keyResponse.json();
        throw new Error(err.message || 'Failed to fetch public key');
      }
      
      const { key_id, key } = await keyResponse.json();

      // 2. Encrypt the secret value
      const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
      const binsec = sodium.from_string(secretValue);
      const encBytes = sodium.crypto_box_seal(binsec, binkey);
      const encryptedValue = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

      // 3. Create or update the secret
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${repoName}/actions/secrets/${secretName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          encrypted_value: encryptedValue,
          key_id: key_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to set secret ${secretName}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`Error setting secret ${secretName}:`, error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Sets up all required secrets for a tenant repository
   */
  async setupTenantSecrets(repoName) {
    const secrets = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_GITHUB_TOKEN: this.token
    };

    const results = [];
    for (const [name, value] of Object.entries(secrets)) {
      results.push(await this.setSecret(repoName, name, value));
    }
    return results;
  },

  /**
   * Sets up secrets for the core repository (template)
   */
  async setupCoreSecrets() {
    const coreRepo = 'prysma';
    return this.setupTenantSecrets(coreRepo);
  },

  /**
   * Manually triggers the deployment workflow
   */
  async dispatchWorkflow(repoName) {
    try {
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${repoName}/actions/workflows/deploy.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Could not dispatch workflow:', errorData.message);
        return { success: false, error: errorData.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error dispatching workflow:', error);
      return { success: false, error: error.message };
    }
  },

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
   * Enables GitHub Pages and sets source to GitHub Actions (workflow)
   */
  async enablePages(repoName) {
    try {
      // 1. First enable Pages (defaults to branch)
      await fetch(`https://api.github.com/repos/${this.owner}/${repoName}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: { branch: 'main', path: '/' }
        })
      });

      // Simple delay to let GitHub process the activation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Switch source to 'workflow' (GitHub Actions)
      const response = await fetch(`https://api.github.com/repos/${this.owner}/${repoName}/pages`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          build_type: 'workflow'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Could not switch Pages to Actions automatically:', errorData.message);
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
