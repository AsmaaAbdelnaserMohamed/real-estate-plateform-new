import edgeProLogo from "../../assets/edge_prologo.png";
import "./Brand.css";

export default function Brand({ className = "" }) {
  return (
    <span className={`platform-brand${className ? ` ${className}` : ""}`}>
      <img
        src={edgeProLogo}
        alt="EDGE PRO logo"
        className="platform-brand__logo"
      />
      <span className="platform-brand__divider" aria-hidden="true" />
      <span className="platform-brand__name">
        Geo<span>Aqar</span>
      </span>
    </span>
  );
}
