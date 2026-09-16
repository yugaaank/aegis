export default function Footer() {
  return (
    <footer className="border-t border-border-subtle py-6 px-6 text-center">
      <p className="text-xs font-mono text-on-dark/60">
        APPROXIMATE RESULTS — Not for operational use. Full perturbation models (J2, drag, solar radiation) not included.
      </p>
      <p className="text-[10px] text-on-dark/50 mt-1">
        Data: Synthetic debris based on Iridium 33 / Cosmos 2251 fragmentation characteristics
      </p>
    </footer>
  )
}