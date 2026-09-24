function Base({ children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  )
}

export function SendIcon(props) {
  return (
    <Base {...props}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </Base>
  )
}

export function UploadIcon(props) {
  return (
    <Base {...props}>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Base>
  )
}

export function DocIcon(props) {
  return (
    <Base {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </Base>
  )
}

export function TrashIcon(props) {
  return (
    <Base {...props}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6M14 11v6" />
    </Base>
  )
}

export function ShieldIcon(props) {
  return (
    <Base {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  )
}

export function AlertIcon(props) {
  return (
    <Base {...props}>
      <path d="M12 4L2.5 20h19z" />
      <path d="M12 10v4M12 17.5v.5" />
    </Base>
  )
}

export function CheckIcon(props) {
  return (
    <Base {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </Base>
  )
}

export function CopyIcon(props) {
  return (
    <Base {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Base>
  )
}

export function SignOutIcon(props) {
  return (
    <Base {...props}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l-4 4 4 4M6 12h9" />
    </Base>
  )
}

export function BookIcon(props) {
  return (
    <Base {...props}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </Base>
  )
}

export function ChatIcon(props) {
  return (
    <Base {...props}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z" />
    </Base>
  )
}

export function SearchIcon(props) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Base>
  )
}
