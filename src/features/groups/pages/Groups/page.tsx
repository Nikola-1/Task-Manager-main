'use client';
import GroupsComponent from '@/features/groups/components/GroupsComponent';
import GroupsModal from '@/features/groups/components/GroupsModal';
import OptionsGroupsComponent from '@/features/groups/components/OptionsGroupsComponent';
import UsersModal from '@/features/groups/components/UsersModal';
import useGroupState from '@/features/groups/hooks/useGroupState';
export default function GroupsPage() {
  const { groupModalProps, useGroup } = useGroupState();
  return <main className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 text-blue-950">
    <OptionsGroupsComponent {...groupModalProps} {...useGroup} />
    <GroupsComponent {...groupModalProps} {...useGroup} />
    <GroupsModal {...groupModalProps} {...useGroup} />
    <UsersModal {...groupModalProps} {...useGroup} />
  </main>;
}
