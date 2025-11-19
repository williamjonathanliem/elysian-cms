import React, { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  getUsers,
  createUserAccount,
  updateUserAccount,
  deleteUserAccount,
  type UserAccount,
} from 'src/api/client';

import { useAuth } from 'src/auth/AuthProvider';

type FormMode = 'create' | 'edit';

export function AccountsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [rows, setRows] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('owner');

  useEffect(() => {
    if (isAdmin) {
      load();
    }
  }, [isAdmin]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setRows(data);
    } catch (err) {
      console.error('[AccountsView] load error', err);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setMode('create');
    setEditingId(null);
    setUsername('');
    setPassword('');
    setRole('owner');
    setDialogOpen(true);
  }

  function openEditDialog(row: UserAccount) {
    setMode('edit');
    setEditingId(row.id);
    setUsername(row.username);
    setPassword('');
    setRole(row.role);
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      if (mode === 'create') {
        const created = await createUserAccount({ username, password, role });
        setRows((prev) => [...prev, created]);
      } else if (mode === 'edit' && editingId != null) {
        const updated = await updateUserAccount(editingId, {
          username,
          role,
          // only send password if not empty
          ...(password ? { password } : {}),
        });
        setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('[AccountsView] save error', err);
      setError('Failed to save account');
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this account?')) return;
    try {
      await deleteUserAccount(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('[AccountsView] delete error', err);
      setError('Failed to delete account');
    }
  }

  if (!isAdmin) {
    return (
      <DashboardContent maxWidth="md">
        <Alert severity="error" sx={{ mt: 3 }}>
          Only admin can manage accounts.
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="md">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Accounts</Typography>
        <Button variant="contained" onClick={openCreateDialog}>
          Add account
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openEditDialog(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="text"
                          onClick={() => handleDelete(row.id)}
                          disabled={row.id === user?.id}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No accounts yet.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {mode === 'create' ? 'Add account' : 'Edit account'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label={mode === 'create' ? 'Password' : 'Password (leave blank to keep)'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              fullWidth
            >
              <MenuItem value="admin">admin</MenuItem>
              <MenuItem value="owner">owner</MenuItem>
              <MenuItem value="frontdesk_1">frontdesk_1</MenuItem>
              <MenuItem value="frontdesk_2">frontdesk_2</MenuItem>
              <MenuItem value="housekeeper_1">housekeeper_1</MenuItem>
              <MenuItem value="housekeeper_2">housekeeper_2</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
