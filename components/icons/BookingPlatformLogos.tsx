import React from 'react';

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Airbnb Iconic Coral Mark
 */
export function AirbnbLogo({ className = 'w-6 h-6', size = 24, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="#FF5A5F"
        d="M16 1c2.008 0 3.463.974 4.542 2.668.966 1.517 2.457 4.53 4.298 8.877 2.458 5.807 4.092 10.457 4.887 13.916.79 3.442.22 5.539-1.637 6.89-1.748 1.272-3.957 1.346-6.38.212-2.183-1.021-4.077-2.884-5.71-5.61-1.633 2.726-3.527 4.589-5.71 5.61-2.423 1.134-4.632 1.06-6.38-.212-1.857-1.351-2.427-3.448-1.637-6.89.795-3.459 2.429-8.109 4.887-13.916C8.99 8.2 10.481 5.187 11.447 3.67 12.526 1.975 13.981 1 16 1zm0 2.4c-1.127 0-2.02.585-2.73 1.698-.857 1.347-2.316 4.3-4.116 8.556C6.737 19.387 5.176 23.864 4.453 27c-.604 2.628-.277 3.86.757 4.613.985.717 2.378.706 4.14-.118 1.91-.893 3.633-2.613 5.234-5.228a1.2 1.2 0 0 1 2.054 0c1.601 2.615 3.324 4.335 5.234 5.228 1.762.824 3.155.835 4.14.118 1.034-.753 1.361-1.985.757-4.613-.723-3.136-2.284-7.613-4.699-13.346-1.8-4.256-3.259-7.209-4.116-8.556-.71-1.113-1.603-1.698-2.73-1.698zm0 11.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6zm0 2.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"
      />
    </svg>
  );
}

/**
 * MakeMyTrip (MMT) Official Red/Blue Mark
 */
export function MmtLogo({ className = 'w-6 h-6', size = 24, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="7" fill="#E41D2F" />
      <path
        d="M6 21V11h2.8l2.7 5.4 2.7-5.4H17v10h-2.4v-6.3l-2.6 5.1h-1.6L7.8 14.7V21H6z"
        fill="#FFFFFF"
      />
      <circle cx="23.5" cy="11" r="2.5" fill="#0084FF" />
      <path
        d="M19 21V15h2.4v1.5c.5-.9 1.5-1.7 2.8-1.7 1.8 0 3.3 1.3 3.3 3.5V21H25v-2.3c0-.9-.5-1.5-1.3-1.5-.9 0-1.6.7-1.6 1.7V21H19z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Agoda Signature Multi-Color Dots Mark
 */
export function AgodaLogo({ className = 'w-6 h-6', size = 24, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="7" fill="#18181B" stroke="#27272A" strokeWidth="1" />
      <circle cx="7" cy="10" r="2.5" fill="#E1251B" />
      <circle cx="13" cy="8" r="2.5" fill="#FDB813" />
      <circle cx="19" cy="9" r="2.5" fill="#2DA643" />
      <circle cx="25" cy="11" r="2.5" fill="#009AD8" />
      <circle cx="16" cy="14" r="2.5" fill="#7C2283" />
      <text
        x="16"
        y="24"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="7.5"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        letterSpacing="0.5"
      >
        agoda
      </text>
    </svg>
  );
}

/**
 * Booking.com Official Blue 'B.' Insignia
 */
export function BookingComLogo({ className = 'w-6 h-6', size = 24, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="7" fill="#003580" />
      <path
        d="M9 7.5h6.6c2.8 0 4.6 1.4 4.6 3.6 0 1.4-.8 2.5-2 3.1 1.6.5 2.6 1.8 2.6 3.6 0 2.5-2 4.2-5 4.2H9V7.5zm3.5 2.8v3.2h2.8c1 0 1.7-.6 1.7-1.6 0-1-.7-1.6-1.7-1.6h-2.8zm0 5.8v3.5h3.2c1.1 0 1.9-.7 1.9-1.7 0-1.1-.8-1.8-1.9-1.8h-3.2z"
        fill="#FFFFFF"
      />
      <circle cx="22.5" cy="20" r="1.8" fill="#00BAFF" />
    </svg>
  );
}

/**
 * Direct Sanctuary Booking (Nothingness Gold Crest)
 */
export function DirectBookingLogo({ className = 'w-6 h-6', size = 24, ...props }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="7" fill="#18181B" stroke="#D4AF37" strokeWidth="1" />
      <path
        d="M16 6l7 4.5v6.5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10v-6.5L16 6z"
        fill="rgba(212,175,55,0.15)"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M13 16l2 2 4-4"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type SupportedPlatform = 'airbnb' | 'makemytrip' | 'agoda' | 'booking.com' | 'direct';

export interface PlatformMeta {
  id: SupportedPlatform;
  name: string;
  badge: string;
  color: string;
  Logo: React.ComponentType<LogoProps>;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    badge: 'Airbnb Stay',
    color: '#FF5A5F',
    Logo: AirbnbLogo,
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    badge: 'MMT / Goibibo',
    color: '#E41D2F',
    Logo: MmtLogo,
  },
  {
    id: 'agoda',
    name: 'Agoda',
    badge: 'Agoda Homes',
    color: '#2DA643',
    Logo: AgodaLogo,
  },
  {
    id: 'booking.com',
    name: 'Booking.com',
    badge: 'Booking.com',
    color: '#003580',
    Logo: BookingComLogo,
  },
  {
    id: 'direct',
    name: 'Direct Stay',
    badge: 'Nothingness VIP',
    color: '#D4AF37',
    Logo: DirectBookingLogo,
  },
];
