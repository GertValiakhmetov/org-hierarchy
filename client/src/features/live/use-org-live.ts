import { type LiveMessage, type OrgNodeDto, PATCH_FIELDS, type PatchField } from '@shared/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { orgTreeKeys } from '@/shared/api/org-tree';
import { applyPatch, parseLiveMessage } from '@/shared/api/org-tree.schema';
import { type ConnectionStatus, createReconnectingSocket } from '@/shared/transport/socket';

function liveUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/live`;
}

export interface LivePatch {
  nodeId: string;
  fields: readonly PatchField[];
  /** Timestamp, used only to restart the fade when the same node changes twice. */
  at: number;
}

export interface LiveState {
  status: ConnectionStatus;
  lastPatch: LivePatch | null;
}

interface UseOrgLiveOptions {
  /** Called during the patch so the consumer can recompute just that branch. */
  onNodePatched: (nodeId: string) => void;
}

export function useOrgLive({ onNodePatched }: UseOrgLiveOptions): LiveState {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastPatch, setLastPatch] = useState<LiveState['lastPatch']>(null);

  const patchedRef = useRef(onNodePatched);
  patchedRef.current = onNodePatched;

  const lastVersionRef = useRef<number | null>(null);

  const handleMessage = useCallback(
    (data: unknown) => {
      let message: LiveMessage;
      try {
        message = parseLiveMessage(data);
      } catch (error) {
        console.error('[live] отброшено некорректное сообщение', error);
        return;
      }

      if (message.type === 'hello') {
        const previous = lastVersionRef.current;
        lastVersionRef.current = message.version;

        // Only a version that moved while we were away means the cache is
        // stale; reconnecting by itself is not a reason to refetch.
        if (previous !== null && previous !== message.version) {
          void queryClient.invalidateQueries({ queryKey: orgTreeKeys.all });
        }
        return;
      }

      lastVersionRef.current = message.version;
      const { patch } = message;

      let hit = false;
      queryClient.setQueryData<OrgNodeDto[]>(orgTreeKeys.all, (nodes) => {
        if (!nodes) return nodes;
        const next = applyPatch(nodes, patch);
        hit = next !== nodes;
        return next;
      });

      if (!hit) return;

      patchedRef.current(patch.id);
      setLastPatch({
        nodeId: patch.id,
        fields: PATCH_FIELDS.filter((field) => patch[field] !== undefined),
        at: Date.now(),
      });
    },
    [queryClient],
  );

  useEffect(() => {
    const socket = createReconnectingSocket({
      url: liveUrl(),
      onMessage: handleMessage,
      onStatusChange: setStatus,
    });

    return () => socket.close();
  }, [handleMessage]);

  return { status, lastPatch };
}
