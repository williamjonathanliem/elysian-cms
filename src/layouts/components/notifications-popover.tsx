import type { IconButtonProps } from '@mui/material/IconButton';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type NotificationItemProps = {
  id: string;
  type?: string;
  title: string;
  description?: string;
  avatarUrl?: string | null;
  isUnRead?: boolean;
  postedAt?: string | number | null;
};

export type NotificationsPopoverProps = IconButtonProps & {
  data: NotificationItemProps[];
};

function formatTime(value?: string | number | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

// ----------------------------------------------------------------------

export function NotificationsPopover({ data, ...other }: NotificationsPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  const totalUnRead = useMemo(
    () => data.filter((item) => item.isUnRead).length,
    [data],
  );

  const sorted = useMemo(
    () =>
      [...data].sort((a, b) => {
        const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        return tb - ta;
      }),
    [data],
  );

  // simple split: first 3 as "NEW", rest as "BEFORE THAT"
  const newItems = sorted.slice(0, 3);
  const olderItems = sorted.slice(3);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        color={open || totalUnRead ? 'primary' : 'default'}
        onClick={handleOpen}
        {...other}
      >
        <Badge color="error" variant={totalUnRead ? 'dot' : 'standard'}>
          <Iconify icon="solar:bell-bing-bold-duotone" width={24} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 360, maxWidth: '100%' },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">Notifications</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            You have {totalUnRead} unread messages
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              New
            </Typography>
          </Box>

          <List disablePadding>
            {newItems.map((item) => (
              <ListItem
                key={item.id}
                alignItems="flex-start"
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: item.isUnRead ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemAvatar>
                  {item.avatarUrl ? (
                    <Avatar src={item.avatarUrl} />
                  ) : (
                    <Avatar>
                      <Iconify icon="solar:bell-bing-bold-duotone" width={20} />
                    </Avatar>
                  )}
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography variant="subtitle2" noWrap>
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      {item.description && (
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary' }}
                          noWrap
                        >
                          {item.description}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}
                      >
                        {formatTime(item.postedAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}

            {newItems.length === 0 && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No new notifications.
                </Typography>
              </Box>
            )}
          </List>

          <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="overline" sx={{ color: 'text.secondary' }}>
              Before that
            </Typography>
          </Box>

          <List disablePadding>
            {olderItems.map((item) => (
              <ListItem key={item.id} alignItems="flex-start" sx={{ px: 2, py: 1 }}>
                <ListItemAvatar>
                  {item.avatarUrl ? (
                    <Avatar src={item.avatarUrl} />
                  ) : (
                    <Avatar>
                      <Iconify icon="solar:bell-bing-bold-duotone" width={20} />
                    </Avatar>
                  )}
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography variant="subtitle2" noWrap>
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      {item.description && (
                        <Typography
                          variant="body2"
                          sx={{ color: 'text.secondary' }}
                          noWrap
                        >
                          {item.description}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}
                      >
                        {formatTime(item.postedAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}

            {olderItems.length === 0 && (
              <Box sx={{ px: 2, pb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No older notifications.
                </Typography>
              </Box>
            )}
          </List>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" color="primary" onClick={handleClose}>
            View all
          </Button>
        </Box>
      </Popover>
    </>
  );
}
