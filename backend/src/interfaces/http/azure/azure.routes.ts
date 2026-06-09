import { Router } from 'express';

interface AzureParsed {
  org: string;
  project: string;
  workItemId: number;
  baseUrl: string;
}

function parseAzureUrl(url: string): AzureParsed | null {
  const devAzure = url.match(/https?:\/\/dev\.azure\.com\/([^/?#]+)\/([^/?#]+)\/_workitems(?:\/edit\/(\d+))?/i);
  if (devAzure) {
    return {
      org: devAzure[1],
      project: decodeURIComponent(devAzure[2]),
      workItemId: parseInt(devAzure[3], 10),
      baseUrl: `https://dev.azure.com/${devAzure[1]}/${devAzure[2]}`
    };
  }
  const vsMatch = url.match(/https?:\/\/([^.]+)\.visualstudio\.com\/([^/?#]+)\/_workitems(?:\/edit\/(\d+))?/i);
  if (vsMatch) {
    return {
      org: vsMatch[1],
      project: decodeURIComponent(vsMatch[2]),
      workItemId: parseInt(vsMatch[3], 10),
      baseUrl: `https://dev.azure.com/${vsMatch[1]}/${vsMatch[2]}`
    };
  }
  return null;
}

function authHeader(pat: string) {
  return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
}

async function adoGet(url: string, pat: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Authorization: authHeader(pat), Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`ADO ${res.status}: ${url}`);
  return res.json();
}

async function adoPost(url: string, pat: string, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader(pat),
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`ADO POST ${res.status}: ${url}`);
  return res.json();
}

const BATCH_SIZE = 200;

async function fetchBatch(org: string, project: string, ids: number[], pat: string): Promise<unknown[]> {
  const fields = [
    'System.Id', 'System.Title', 'System.WorkItemType', 'System.State',
    'System.AssignedTo', 'Microsoft.VSTS.Scheduling.StoryPoints', 'System.Tags',
    'System.AreaPath', 'System.IterationPath'
  ].join(',');

  const results: unknown[] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const url = `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_apis/wit/workitems?ids=${chunk.join(',')}&fields=${fields}&api-version=7.1`;
    const data = await adoGet(url, pat) as { value: unknown[] };
    results.push(...(data.value || []));
  }
  return results;
}

interface RelationEntry { id: number; parentId: number | null }

async function fetchDescendants(org: string, project: string, epicId: number, pat: string): Promise<RelationEntry[]> {
  const url = `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.1`;
  const body = {
    query: `SELECT [System.Id] FROM WorkItemLinks WHERE ([Source].[System.Id] = ${epicId}) AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') MODE (Recursive)`
  };

  const data = await adoPost(url, pat, body) as {
    workItemRelations?: Array<{ rel: string | null; source?: { id: number }; target: { id: number } }>;
  };

  return (data.workItemRelations || [])
    .filter(r => r.rel !== null)
    .map(r => ({
      id: r.target.id,
      parentId: r.source?.id ?? epicId
    }));
}

function mapWorkItem(wi: Record<string, unknown>, parentId: number | null, org: string, project: string) {
  const f = wi.fields as Record<string, unknown>;
  const assignedTo = f['System.AssignedTo'] as Record<string, string> | null | undefined;
  return {
    id: wi.id as number,
    title: f['System.Title'] as string,
    type: f['System.WorkItemType'] as string,
    state: f['System.State'] as string,
    assignedTo: assignedTo?.displayName ?? null,
    assignedToAvatar: assignedTo?.imageUrl ?? null,
    storyPoints: (f['Microsoft.VSTS.Scheduling.StoryPoints'] as number) ?? null,
    tags: (f['System.Tags'] as string) ?? null,
    areaPath: (f['System.AreaPath'] as string) ?? null,
    iterationPath: (f['System.IterationPath'] as string) ?? null,
    url: `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_workitems/edit/${wi.id}`,
    parentId
  };
}

export function createAzureRouter() {
  const router = Router();

  router.get('/api/azure/workitems', async (req, res) => {
    try {
      const pat = process.env.AZURE_PAT;
      if (!pat) {
        res.status(503).json({ error: 'AZURE_PAT não configurado no servidor.' });
        return;
      }

      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'Parâmetro url é obrigatório.' });
        return;
      }

      const parsed = parseAzureUrl(url);
      if (!parsed || isNaN(parsed.workItemId)) {
        res.status(400).json({ error: 'URL do Azure DevOps inválida. Formato esperado: https://dev.azure.com/{org}/{projeto}/_workitems/edit/{id}' });
        return;
      }

      const { org, project, workItemId } = parsed;

      // Buscar Epic + todos descendants via WIQL recursivo
      const [epicRaw, relations] = await Promise.all([
        fetchBatch(org, project, [workItemId], pat),
        fetchDescendants(org, project, workItemId, pat)
      ]);

      const epicWi = epicRaw[0] as Record<string, unknown> | undefined;
      if (!epicWi) {
        res.status(404).json({ error: 'Work item não encontrado.' });
        return;
      }

      const epic = mapWorkItem(epicWi, null, org, project);

      if (relations.length === 0) {
        res.json({ epic, items: [] });
        return;
      }

      const descendantIds = relations.map(r => r.id);
      const parentMap = new Map(relations.map(r => [r.id, r.parentId]));

      const rawItems = await fetchBatch(org, project, descendantIds, pat);
      const items = (rawItems as Record<string, unknown>[]).map(wi =>
        mapWorkItem(wi, parentMap.get(wi.id as number) ?? null, org, project)
      );

      res.json({ epic, items });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro interno';
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
