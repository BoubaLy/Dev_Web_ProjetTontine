import { Link } from 'react-router-dom';
import { Plus, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../lib/queries';
import { Loading, EmptyState } from '../components/ui';
import { Stagger, StaggerItem } from '../components/motion';
import GroupCard from '../components/GroupCard';

export default function Groups() {
  const { user } = useAuth();
  const { data: groups, isLoading } = useGroups();
  if (isLoading) return <Loading />;
  const list = groups ?? [];

  return (
    <div className="relative isolate space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Mes tontines</h1>
        <div className="flex gap-2">
          <Link to="/groupes/nouveau" className="btn-primary"><Plus size={18} /> Créer</Link>
          <Link to="/groupes/rejoindre" className="btn-secondary"><UserPlus size={18} /> Rejoindre</Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <EmptyState icon="👥" title="Aucune tontine pour l'instant"
            message="Créez votre premier groupe ou rejoignez-en un avec un code d'invitation partagé par un administrateur."
            action={<Link to="/groupes/nouveau" className="btn-primary">Créer une tontine</Link>} />
        </div>
      ) : (
        <Stagger className="grid gap-3 sm:grid-cols-2">
          {list.map((g) => <StaggerItem key={g.id}><GroupCard group={g} admin={g.admin_id === user?.id} /></StaggerItem>)}
        </Stagger>
      )}
    </div>
  );
}
