import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

const unwrap = (res) => res.data.data;

export const keys = {
  groups: ['groups'],
  group: (id) => ['group', id],
  currentCycle: (groupId) => ['cycle', 'current', groupId],
  dashboard: (cycleId) => ['cycle', cycleId, 'dashboard'],
  myHistory: ['me', 'contributions'],
  notifications: ['notifications'],
  disputes: ['disputes'],
  kyc: ['kyc'],
  kycPending: ['kyc', 'pending'],
  adminUsers: ['admin', 'users'],
};

// --- Groupes ---
export const useGroups = () => useQuery({ queryKey: keys.groups, queryFn: () => api.get('/groups').then(unwrap) });
export const useGroup = (id) => useQuery({ queryKey: keys.group(id), queryFn: () => api.get(`/groups/${id}`).then(unwrap), enabled: !!id });

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p) => api.post('/groups', p).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.groups }) });
}
export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ code }) => api.post(`/groups/join/${code}`, { reglement_accepte: true }).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.groups }) });
}
export function useInvite(groupId) {
  return useMutation({ mutationFn: () => api.post(`/groups/${groupId}/invite`).then(unwrap) });
}
export function useValidateMember(groupId) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ userId, decision }) => api.patch(`/groups/${groupId}/members/${userId}/validate`, { decision }).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.group(groupId) }) });
}
export function useStartCycle(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/groups/${groupId}/start-cycle`).then(unwrap),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.group(groupId) }); qc.invalidateQueries({ queryKey: keys.currentCycle(groupId) }); },
  });
}

// --- Cycle ---
export const useCurrentCycle = (groupId) => useQuery({ queryKey: keys.currentCycle(groupId), queryFn: () => api.get(`/groups/${groupId}/cycles/current`).then(unwrap), enabled: !!groupId, retry: false });
export const useDashboard = (cycleId) => useQuery({ queryKey: keys.dashboard(cycleId), queryFn: () => api.get(`/cycles/${cycleId}/dashboard`).then(unwrap), enabled: !!cycleId });

export function useCloseCycle(groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cycleId) => api.post(`/cycles/${cycleId}/close`).then(unwrap),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.currentCycle(groupId) }); qc.invalidateQueries({ queryKey: keys.group(groupId) }); },
  });
}

// --- Cotisations ---
export function useDeclareContribution(cycleId, groupId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p) => api.post(`/cycles/${cycleId}/contributions`, p).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard(cycleId) });
      qc.invalidateQueries({ queryKey: keys.myHistory });
      if (groupId) qc.invalidateQueries({ queryKey: keys.currentCycle(groupId) });
    },
  });
}
export function useConfirmContribution() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => api.patch(`/contributions/${id}/confirm`).then(unwrap), onSuccess: () => { qc.invalidateQueries({ queryKey: keys.notifications }); qc.invalidateQueries({ queryKey: keys.myHistory }); } });
}
export function useDisputeContribution() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ contributionId, description }) => api.patch(`/contributions/${contributionId}/dispute`, { description }).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }) });
}
export const useMyHistory = () => useQuery({ queryKey: keys.myHistory, queryFn: () => api.get('/me/contributions').then(unwrap) });

// --- Notifications ---
export const useNotifications = () => useQuery({ queryKey: keys.notifications, queryFn: () => api.get('/notifications').then(unwrap) });
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => api.patch(`/notifications/${id}/read`), onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }) });
}

// --- Litiges ---
export const useDisputes = () => useQuery({ queryKey: keys.disputes, queryFn: () => api.get('/disputes').then(unwrap) });
export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p) => api.post('/disputes', p).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.disputes }) });
}
export function useInvestigateDispute() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id) => api.patch(`/disputes/${id}/investigate`).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.disputes }) });
}
export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...p }) => api.patch(`/disputes/${id}/resolve`, p).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.disputes }) });
}

// --- KYC ---
export const useMyKyc = () => useQuery({ queryKey: keys.kyc, queryFn: () => api.get('/kyc').then(unwrap) });
export function useUploadKyc() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (formData) => api.post('/kyc/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.kyc }) });
}

// --- Admin ---
export const useKycPending = () => useQuery({ queryKey: keys.kycPending, queryFn: () => api.get('/kyc/pending').then(unwrap) });
export function useValidateKyc() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, decision }) => api.patch(`/kyc/${id}/validate`, { decision }).then(unwrap), onSuccess: () => { qc.invalidateQueries({ queryKey: keys.kycPending }); qc.invalidateQueries({ queryKey: keys.adminUsers }); } });
}
export const useAdminUsers = () => useQuery({ queryKey: keys.adminUsers, queryFn: () => api.get('/users').then(unwrap) });
export function useFreezeUser() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, gele }) => api.patch(`/users/${id}/freeze`, { gele }).then(unwrap), onSuccess: () => qc.invalidateQueries({ queryKey: keys.adminUsers }) });
}

// --- Helpers ---
export const formatFCFA = (m) => `${Math.round(Number(m) || 0).toLocaleString('fr-FR')} FCFA`;
