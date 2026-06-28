/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, UserRole } from '../types';

interface RoleSelectorProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  allUsers: User[];
}

export default function RoleSelector({ currentUser, onUserChange, allUsers }: RoleSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-primary-dark/80 px-3 py-1.5 rounded-full border border-border">
      <span className="text-xs text-text-muted font-mono uppercase tracking-wider">Act As:</span>
      <select
        value={currentUser.id}
        onChange={(e) => {
          const selected = allUsers.find(u => u.id === e.target.value);
          if (selected) onUserChange(selected);
        }}
        className="bg-transparent text-xs text-accent-neon font-semibold focus:outline-none cursor-pointer pr-1"
      >
        {allUsers.map((user) => (
          <option key={user.id} value={user.id} className="bg-bg-surface text-white">
            {user.name} ({user.role})
          </option>
        ))}
      </select>
    </div>
  );
}
