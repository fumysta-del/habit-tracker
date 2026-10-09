import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

function BaseIcon({
  size = 20,
  strokeWidth = 1.8,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
      <path d="M10 19v-5h4v5" />
    </BaseIcon>
  );
}

export function TasksIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 7h11" />
      <path d="M8 12h11" />
      <path d="M8 17h11" />
      <path d="m3.5 7 1.5 1.5L7.5 6" />
      <path d="m3.5 12 1.5 1.5L7.5 11" />
      <path d="m3.5 17 1.5 1.5L7.5 16" />
    </BaseIcon>
  );
}

export function GrowthIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 17.5 10 12l3.5 3 6-7" />
      <path d="M14.5 8h5v5" />
      <path d="M4.5 20h15" />
    </BaseIcon>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M6.5 19c.8-2.7 3-4 5.5-4s4.7 1.3 5.5 4" />
    </BaseIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-1.7-1L14.5 3h-5L9.2 6a7.8 7.8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 1.7 1l.3 3h5l.3-3a7.8 7.8 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z" />
    </BaseIcon>
  );
}

export function TreeclockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20v-5.5" />
      <path d="M9 20h6" />
      <path d="M7.5 15a4 4 0 0 1-1.1-7.7 5.8 5.8 0 0 1 11 .6 3.7 3.7 0 0 1-.8 7.1" />
      <path d="M12 15l-2.5-2M12 15l2.3-2.1" />
    </BaseIcon>
  );
}

export function ClassNoteIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 5.5h8" />
      <path d="M8 9h8" />
      <path d="M8 12.5h5" />
      <path d="M6 3.5h12a1 1 0 0 1 1 1V20l-3-1.8L13 20l-3-1.8L7 20l-2-1.2V4.5a1 1 0 0 1 1-1Z" />
    </BaseIcon>
  );
}