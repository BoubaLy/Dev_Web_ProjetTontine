import { useState } from 'react';
import { Snowflake, Sun, ShieldCheck } from 'lucide-react';
import { useAdminUsers, useFreezeUser } from '../../lib/queries';
import { Loading, Avatar, Toast } from '../../components/ui';
import { scoreBadge } from '../../lib/status';

const KYC = {
  verifie: { label: 'KYC ✓', cls: 'bg-success-soft text-success' },
  en_attente: { label: 'KYC ?', cls: 'bg-gold-soft text-gold' },
  rejete: { label: 'KYC ✗', cls: 'bg-danger-soft text-danger' },
};

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const freeze = useFreezeUser();
  const [toast, setToast] = useState(null);

  const toggle = async (u) => {
    try { await freeze.mutateAsync({ id: u.id, gele: !u.est_gele }); setToast(u.est_gele ? 'Compte dégelé.' : 'Compte gelé.'); }
    catch (e) { setToast(e.response?.data?.message ?? 'Action impossible.'); }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Comptes</h1>
      <div className="space-y-3">
        {(users ?? []).map((u) => {
          const kyc = KYC[u.statut_kyc] ?? KYC.en_attente;
          const isSuper = u.role === 'super_admin';
          const sb = scoreBadge(u.score_fiabilite);
          return (
            <div key={u.id} className="card space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={`${u.prenom} ${u.nom}`} size={44} />
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-semibold text-ink">{u.prenom} {u.nom} {isSuper && <ShieldCheck size={15} className="text-primary" />}</p>
                  <p className="text-xs text-ink-faint">{u.telephone}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`pill ${kyc.cls}`}>{kyc.label}</span>
                  <span className="text-xs text-ink-faint">Score <b className={sb.cls.includes('success') ? 'text-success' : sb.cls.includes('gold') ? 'text-gold' : 'text-danger'}>{Number(u.score_fiabilite).toFixed(0)}%</b></span>
                </div>
              </div>
              {!isSuper && (
                u.est_gele
                  ? <button className="btn-secondary w-full py-2 text-sm" onClick={() => toggle(u)}><Sun size={16} /> Dégeler le compte</button>
                  : <button className="btn-danger w-full py-2 text-sm" onClick={() => toggle(u)}><Snowflake size={16} /> Geler le compte</button>
              )}
              {u.est_gele && <p className="text-xs text-danger">⚠️ Compte gelé — ne peut ni cotiser, ni recevoir, ni se connecter (RG-06).</p>}
            </div>
          );
        })}
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
