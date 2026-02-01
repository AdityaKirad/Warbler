export function Spinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <g className="animation-duration-2000 origin-center animate-spin">
        <circle
          className="animate-spinner"
          cx="12"
          cy="12"
          r="9.5"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
