import { getInitiativeSettings } from '@/hooks/useInitiativeSettings';

export const getExternalLinkMeta = (type?: string) => {
  if (type === 'Microsoft Azure' || type === 'Azure') {
    return { label: 'Microsoft Azure', short: 'Az', background: '#DBEAFE', color: '#1D4ED8', kind: 'azure' as const };
  }
  if (type === 'BMC Helix') {
    return { label: 'BMC Helix', short: 'Bm', background: '#FEF3C7', color: '#92400E', kind: 'bmc' as const };
  }
  return { label: type || 'Outra ferramenta', short: 'Ln', background: '#F1F5F9', color: '#475569', kind: 'text' as const };
};

export const ExternalToolIcon = ({ kind, size }: { kind: 'azure' | 'bmc' | 'text'; size: number }) => {
  if (kind === 'azure') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path d="M13.8 2 6.2 15.2h4.5L18.3 2h-4.5Z" fill="#0078D4" />
        <path d="M14.5 12.1 19.1 20H9.4l2.6-4.5h4.7l-2.2-3.4Z" fill="#50A9F8" />
      </svg>
    );
  }
  if (kind === 'bmc') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
        <rect x="3" y="3" width="18" height="18" rx="5" fill="#F97316" />
        <path d="M8 8h6a2.5 2.5 0 0 1 0 5H8V8Zm0 5h6.5a2.5 2.5 0 0 1 0 5H8v-5Z" fill="#FFFFFF" />
      </svg>
    );
  }
  return null;
};

export const normalizeExternalUrl = (url?: string) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const resolveExternalUrl = (type?: string, name?: string, url?: string): string => {
  const direct = normalizeExternalUrl(url);
  if (direct) return direct;
  // Fallback: construct from base URL + name for existing data saved without URL
  const { azureBaseUrl, helixBaseUrl } = getInitiativeSettings();
  const isAzure = type === 'Microsoft Azure' || type === 'Azure';
  const isHelix = type === 'BMC Helix';
  if (isAzure && azureBaseUrl && name) return normalizeExternalUrl(azureBaseUrl + name);
  if (isHelix && helixBaseUrl && name) return normalizeExternalUrl(helixBaseUrl + name);
  return '';
};
