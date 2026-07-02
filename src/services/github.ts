import { Octokit } from "@octokit/rest";
import { ENV } from "../config/env";
import { GITHUB_ASSETS, LIMITS } from "../utils/constants";

const octokit = new Octokit({
  auth: ENV.GT_ACCESS_TOKEN,
  baseUrl: "https://api.github.com",
});

export const createGithubIssue = async (title: string, body: string) => {
  return octokit.rest.issues.create({
    owner: ENV.GT_USERNAME,
    repo: ENV.GT_REPOSITORY,
    title,
    body,
  });
};

// Searches open issues for titles similar to the query (up to 3 results).
export const searchGithubIssues = async (query: string) => {
  return octokit.rest.search.issuesAndPullRequests({
    q: `repo:${ENV.GT_USERNAME}/${ENV.GT_REPOSITORY} is:issue is:open ${query}`,
    per_page: 3,
  });
};

// Downloads a file from Discord CDN and uploads it to the repo under issue-assets/.
// Returns the raw GitHub URL to embed as a Markdown image in the issue body.
// Note: raw URLs only render in GitHub issues on public repos.
export const uploadAttachmentToGithub = async (
  discordUrl: string,
  fileName: string,
): Promise<string> => {
  const downloadRes = await fetch(discordUrl);
  if (!downloadRes.ok) {
    throw new Error(
      `Failed to download attachment: ${downloadRes.status} ${downloadRes.statusText}`,
    );
  }

  const buffer = Buffer.from(await downloadRes.arrayBuffer());

  if (buffer.byteLength > LIMITS.MAX_ATTACHMENT_BYTES) {
    const limitMB = (LIMITS.MAX_ATTACHMENT_BYTES / (1024 * 1024)).toFixed(0);
    const fileMB = (buffer.byteLength / (1024 * 1024)).toFixed(1);
    throw new Error(
      `"${fileName}" is ${fileMB} MB — max allowed is ${limitMB} MB.`,
    );
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const repoPath = `${GITHUB_ASSETS.FOLDER}/${Date.now()}-${safeName}`;

  const uploadRes = await octokit.rest.repos.createOrUpdateFileContents({
    owner: ENV.GT_USERNAME,
    repo: ENV.GT_REPOSITORY,
    path: repoPath,
    message: `${GITHUB_ASSETS.COMMIT_MESSAGE} ${safeName}`,
    content: buffer.toString("base64"),
  });

  // For private repos, download_url contains a temporary token that expires.
  // Instead, return the blob URL with ?raw=true which GitHub renders securely 
  // as a permanent image for users who have repository access.
  const htmlUrl = uploadRes.data.content?.html_url;
  if (htmlUrl) {
    return `${htmlUrl}?raw=true`;
  }

  return `https://github.com/${ENV.GT_USERNAME}/${ENV.GT_REPOSITORY}/blob/HEAD/${repoPath}?raw=true`;
};
