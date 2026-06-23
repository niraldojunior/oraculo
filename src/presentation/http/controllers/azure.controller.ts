import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Query,
  ServiceUnavailableException
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

interface AzureParsed {
  org: string;
  project: string;
  workItemId: number;
}

interface RelationEntry {
  id: number;
  parentId: number | null;
}

function parseAzureUrl(url: string): AzureParsed | null {
  const devAzure = url.match(/https?:\/\/dev\.azure\.com\/([^/?#]+)\/([^/?#]+)\/_workitems(?:\/edit\/(\d+))?/i);
  if (devAzure) {
    return {
      org: devAzure[1],
      project: decodeURIComponent(devAzure[2]),
      workItemId: parseInt(devAzure[3], 10)
    };
  }

  const vsMatch = url.match(/https?:\/\/([^.]+)\.visualstudio\.com\/([^/?#]+)\/_workitems(?:\/edit\/(\d+))?/i);
  if (vsMatch) {
    return {
      org: vsMatch[1],
      project: decodeURIComponent(vsMatch[2]),
      workItemId: parseInt(vsMatch[3], 10)
    };
  }

  return null;
}

function authHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
}

function adoHttpError(status: number): Error {
  if (status === 401 || status === 203) {
    return new Error('Token de acesso inválido ou expirado. Verifique se o AZURE_PAT configurado no servidor ainda é válido.');
  }
  if (status === 403) {
    return new Error('Sem permissão para acessar este projeto no Azure DevOps. Verifique se o token tem permissão de leitura em Work Items.');
  }
  if (status === 404) {
    return new Error('Projeto ou work item não encontrado no Azure DevOps. Verifique a URL configurada na iniciativa.');
  }
  if (status === 429) {
    return new Error('Limite de requisições atingido no Azure DevOps. Aguarde alguns instantes e tente novamente.');
  }

  return new Error(`Azure DevOps retornou erro ${status}. Verifique as configurações de acesso.`);
}

async function adoGet(url: string, pat: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Authorization: authHeader(pat), Accept: 'application/json' }
  });

  if (!res.ok) throw adoHttpError(res.status);
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

  if (!res.ok) throw adoHttpError(res.status);
  return res.json();
}

const BATCH_SIZE = 200;

async function fetchBatch(org: string, project: string, ids: number[], pat: string): Promise<unknown[]> {
  const fields = [
    'System.Id',
    'System.Title',
    'System.WorkItemType',
    'System.State',
    'System.AssignedTo',
    'Microsoft.VSTS.Scheduling.StoryPoints',
    'System.Tags',
    'System.AreaPath',
    'System.IterationPath'
  ].join(',');

  const results: unknown[] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const url = `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_apis/wit/workitems?ids=${chunk.join(',')}&fields=${fields}&api-version=7.1`;
    const data = (await adoGet(url, pat)) as { value: unknown[] };
    results.push(...(data.value || []));
  }

  return results;
}

async function fetchDescendants(org: string, project: string, epicId: number, pat: string): Promise<RelationEntry[]> {
  const url = `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.1`;
  const body = {
    query: `SELECT [System.Id] FROM WorkItemLinks WHERE ([Source].[System.Id] = ${epicId}) AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') MODE (Recursive)`
  };

  const data = (await adoPost(url, pat, body)) as {
    workItemRelations?: Array<{
      rel: string | null;
      source?: { id: number };
      target: { id: number };
    }>;
  };

  return (data.workItemRelations || [])
    .filter(item => item.rel !== null)
    .map(item => ({
      id: item.target.id,
      parentId: item.source?.id ?? epicId
    }));
}

function mapWorkItem(wi: Record<string, unknown>, parentId: number | null, org: string, project: string) {
  const fields = wi.fields as Record<string, unknown>;
  const assignedTo = fields['System.AssignedTo'] as Record<string, string> | null | undefined;

  return {
    id: wi.id as number,
    title: fields['System.Title'] as string,
    type: fields['System.WorkItemType'] as string,
    state: fields['System.State'] as string,
    assignedTo: assignedTo?.displayName ?? null,
    assignedToAvatar: assignedTo?.imageUrl ?? null,
    storyPoints: (fields['Microsoft.VSTS.Scheduling.StoryPoints'] as number) ?? null,
    tags: (fields['System.Tags'] as string) ?? null,
    areaPath: (fields['System.AreaPath'] as string) ?? null,
    iterationPath: (fields['System.IterationPath'] as string) ?? null,
    url: `https://dev.azure.com/${org}/${encodeURIComponent(project)}/_workitems/edit/${wi.id}`,
    parentId
  };
}

@ApiTags('azure')
@Controller(['azure', 'api/azure'])
export class AzureController {
  @Get('workitems')
  @ApiOperation({ summary: 'Fetch Azure DevOps epic and descendants by work item URL' })
  async workitems(@Query('url') url?: string) {
    const pat = process.env.AZURE_PAT;
    if (!pat) {
      throw new ServiceUnavailableException('AZURE_PAT não configurado no servidor.');
    }

    if (!url) {
      throw new BadRequestException('Parâmetro url é obrigatório.');
    }

    const parsed = parseAzureUrl(url);
    if (!parsed || Number.isNaN(parsed.workItemId)) {
      throw new BadRequestException('URL do Azure DevOps inválida. Formato esperado: https://dev.azure.com/{org}/{projeto}/_workitems/edit/{id}');
    }

    try {
      const { org, project, workItemId } = parsed;

      const [epicRaw, relations] = await Promise.all([
        fetchBatch(org, project, [workItemId], pat),
        fetchDescendants(org, project, workItemId, pat)
      ]);

      const epicWi = epicRaw[0] as Record<string, unknown> | undefined;
      if (!epicWi) {
        throw new BadRequestException('Work item não encontrado.');
      }

      const epic = mapWorkItem(epicWi, null, org, project);

      if (relations.length === 0) {
        return { epic, items: [] };
      }

      const descendantIds = relations.map(item => item.id);
      const parentMap = new Map(relations.map(item => [item.id, item.parentId]));

      const rawItems = await fetchBatch(org, project, descendantIds, pat);
      const items = (rawItems as Record<string, unknown>[]).map(item =>
        mapWorkItem(item, parentMap.get(item.id as number) ?? null, org, project)
      );

      return { epic, items };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Erro interno';
      throw new InternalServerErrorException(message);
    }
  }
}
