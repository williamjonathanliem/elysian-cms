// src/components/logo/logo.tsx
import type { LinkProps } from "@mui/material/Link";

import { mergeClasses } from "minimal-shared/utils";

import Link from "@mui/material/Link";
import { styled } from "@mui/material/styles";

import { RouterLink } from "src/routes/components";

import { logoClasses } from "./classes";

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

const SINGLE_LOGO_SRC = '/assets/icons/workspaces/logo.png';
const FULL_LOGO_SRC = '/assets/icons/workspaces/logo.png';

export function Logo({
  sx,
  disabled,
  className,
  href = "/",
  isSingle = true,
  ...other
}: LogoProps) {
  const src = isSingle ? SINGLE_LOGO_SRC : FULL_LOGO_SRC;

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 40,
          height: 40,
          ...(!isSingle && { width: 120, height: 40 }),
          ...(disabled && { pointerEvents: "none" }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <img
        src={src}
        alt="Villa logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: "transparent",
  display: "inline-flex",
  verticalAlign: "middle",
}));
