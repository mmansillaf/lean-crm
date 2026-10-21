import { pool } from "@/db";

export interface AgentAssignment {
  userId: string;
  fullName: string;
  email: string;
}

export async function assignLeadRoundRobin(organizationId: string): Promise<AgentAssignment | null> {
  // 1. Obtener agentes disponibles de la organización ordenados por menor asignación reciente
  const query = `
    select
      u.id as "userId",
      u.full_name as "fullName",
      u.email,
      count(c.id) as active_conversations
    from public.organization_members om
    join public.users u on u.id = om.user_id
    left join public.conversations c
      on c.assigned_user_id = u.id
     and c.organization_id = om.organization_id
     and c.status = 'human'
    where om.organization_id = $1
      and om.role in ('agent', 'admin')
    group by u.id, u.full_name, u.email
    order by active_conversations asc, u.created_at asc
    limit 1;
  `;

  const { rows } = await pool.query<AgentAssignment>(query, [organizationId]);
  return rows[0] || null;
}
