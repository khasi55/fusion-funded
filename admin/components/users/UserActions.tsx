"use client";

import { useState } from "react";
import { Trash2, Mail, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserActionsProps {
    userId: string;
    currentEmail: string;
}

export function UserActions({ userId, currentEmail }: UserActionsProps) {
    const router = useRouter();
    const [editingEmail, setEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState(currentEmail);
    const [savingEmail, setSavingEmail] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleEditEmail = async () => {
        if (!newEmail.trim() || newEmail === currentEmail) {
            setEditingEmail(false);
            return;
        }
        setSavingEmail(true);
        try {
            const res = await fetch('/api/admin/users/update-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newEmail: newEmail.trim() })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Email updated successfully');
                setEditingEmail(false);
                router.refresh();
            } else {
                toast.error(data.error || 'Failed to update email');
            }
        } catch {
            toast.error('Error updating email');
        } finally {
            setSavingEmail(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('User deleted successfully');
                router.refresh();
            } else {
                toast.error(data.error || 'Failed to delete user');
                setConfirmDelete(false);
            }
        } catch {
            toast.error('Error deleting user');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="flex items-center justify-end gap-1.5">
            {/* Edit Email */}
            {editingEmail ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                        autoFocus
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEditEmail(); if (e.key === 'Escape') setEditingEmail(false); }}
                        className="w-48 border border-blue-400 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="New email..."
                    />
                    <button
                        onClick={handleEditEmail}
                        disabled={savingEmail}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded border border-emerald-200 disabled:opacity-50"
                    >
                        {savingEmail ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    </button>
                    <button
                        onClick={() => { setEditingEmail(false); setNewEmail(currentEmail); }}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded border border-red-200"
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : confirmDelete ? (
                <div className="flex items-center gap-1">
                    <span className="text-xs text-red-600 font-medium">Delete?</span>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    >
                        {deleting ? <Loader2 size={10} className="animate-spin" /> : null}
                        Yes
                    </button>
                    <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                    >
                        No
                    </button>
                </div>
            ) : (
                <>
                    <button
                        onClick={() => setEditingEmail(true)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded border border-blue-100 transition-colors"
                        title="Edit email"
                    >
                        <Mail size={14} />
                    </button>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-red-100 transition-colors"
                        title="Delete user"
                    >
                        <Trash2 size={14} />
                    </button>
                </>
            )}
        </div>
    );
}
