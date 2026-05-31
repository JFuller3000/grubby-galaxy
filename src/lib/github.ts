export interface PRInfo {
  title: string;
  repo: string;
  state: 'MERGED' | 'OPEN' | 'CLOSED';
  date: string;
}

export interface CommitInfo {
  message: string;
  repo: string;
  date: string;
}

export interface LanguageInfo {
  name: string;
  color: string | null;
  count: number;
}

export interface ActivityData {
  prs: PRInfo[];
  commits: CommitInfo[];
  languages: LanguageInfo[];
  currentStreak: number;
  totalContributions: number;
}

const GITHUB_USERNAME = 'JFuller3000';

const GITHUB_LANG_COLORS: Record<string, string | null> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  Lua: '#000080',
  Shell: '#89e051',
  SCSS: '#c6538c',
  Less: '#1d365d',
};

const graphqlUrl = 'https://api.github.com/graphql';
const restBaseUrl = 'https://api.github.com';

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

async function graphql<T>(query: string, token?: string): Promise<T> {
  const res = await fetch(graphqlUrl, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

async function rest<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${restBaseUrl}${path}`, {
    headers: headers(token),
  });
  if (!res.ok) {
    throw new Error(`REST request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

const graphQlQuery = `
  query {
    user(login: "${GITHUB_USERNAME}") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      repositories(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
        nodes {
          nameWithOwner
          primaryLanguage {
            name
            color
          }
        }
      }
    }
    aopaOrg: organization(login: "aopa") {
      repositories(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          nameWithOwner
          primaryLanguage {
            name
            color
          }
        }
      }
    }
    prs: search(query: "author:${GITHUB_USERNAME} type:pr", type: ISSUE, first: 5) {
      edges {
        node {
          ... on PullRequest {
            title
            repository { nameWithOwner }
            state
            mergedAt
            updatedAt
            createdAt
          }
        }
      }
    }
  }
`;

interface GraphQLResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{
          contributionDays: Array<{
            contributionCount: number;
            date: string;
          }>;
        }>;
      };
    };
    repositories: {
      nodes: Array<{
        nameWithOwner: string;
        primaryLanguage: { name: string; color: string } | null;
      }>;
    };
  };
  aopaOrg: {
    repositories: {
      nodes: Array<{
        nameWithOwner: string;
        primaryLanguage: { name: string; color: string } | null;
      }>;
    };
  } | null;
  prs: {
    edges: Array<{
      node: {
        title: string;
        repository: { nameWithOwner: string };
        state: string;
        mergedAt: string | null;
        updatedAt: string;
        createdAt: string;
      };
    }>;
  };
}

interface RestEvent {
  type: string;
  repo: { name: string };
  payload: {
    commits?: Array<{ message: string; sha: string }>;
    head_commit?: { message: string };
  };
  created_at: string;
  public?: boolean;
}

function computeStreak(weeks: Array<{ contributionDays: Array<{ contributionCount: number; date: string }> }>): number {
  const days: Array<{ count: number; date: string }> = [];
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      days.push(day);
    }
  }
  if (days.length === 0) return 0;
  days.sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    const dayDate = new Date(d.date + 'T00:00:00');
    dayDate.setHours(0, 0, 0, 0);
    if (dayDate > today) continue;
    if (d.contributionCount > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function fetchGitHubActivity(token?: string): Promise<ActivityData> {
  const data = await graphql<GraphQLResponse>(graphQlQuery, token);
  const calendar = data.user.contributionsCollection.contributionCalendar;
  const currentStreak = computeStreak(calendar.weeks);
  const totalContributions = calendar.totalContributions;

  const userRepos = data.user.repositories.nodes;
  const orgRepos = data.aopaOrg?.repositories.nodes ?? [];
  const allRepos = [...userRepos];
  const seen = new Set(userRepos.map((r) => r.nameWithOwner));
  for (const repo of orgRepos) {
    if (!seen.has(repo.nameWithOwner)) {
      allRepos.push(repo);
      seen.add(repo.nameWithOwner);
    }
  }


  const langMap = new Map<string, number>();
  for (const repo of allRepos) {
    const lang = repo.primaryLanguage;
    if (lang) {
      langMap.set(lang.name, (langMap.get(lang.name) || 0) + 1);
    }
  }
  const languages: LanguageInfo[] = Array.from(langMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      color: GITHUB_LANG_COLORS[name] ?? null,
      count,
    }));

  const prs: PRInfo[] = data.prs.edges
    .map((e) => e.node)
    .filter((pr) => pr.title)
    .slice(0, 5)
    .map((pr) => ({
      title: pr.title,
      repo: pr.repository.nameWithOwner,
      state: pr.mergedAt ? 'MERGED' : (pr.state as PRInfo['state']),
      date: pr.mergedAt ?? pr.updatedAt ?? pr.createdAt,
    }));

  let commits: CommitInfo[] = [];
  try {
    const events = await rest<RestEvent[]>(`/users/${GITHUB_USERNAME}/events/public`, token);
    commits = events
      .filter((e) => e.type === 'PushEvent' && e.payload.commits?.length)
      .flatMap((e) =>
        (e.payload.commits ?? []).map((c) => ({
          message: c.message.split('\n')[0].slice(0, 80),
          repo: e.repo.name,
          date: e.created_at,
        }))
      )
      .slice(0, 5);
  } catch {
    commits = [];
  }

  return { prs, commits, languages, currentStreak, totalContributions };
}
